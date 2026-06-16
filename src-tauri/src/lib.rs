use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager};

mod xbox;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let app_handle = app.handle().clone();

            //トレイシステム設定
            let quit = MenuItem::with_id(app, "quit", "終了", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit])?;

            // 💡 1. ツールチップ更新に使うため、変数 `tray` で受け取る
            let tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Xbox Battery Monitor")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray_handle, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app_inner = tray_handle.app_handle();

                        if let Some(window) = app_inner.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            if let Some(window) = app.get_webview_window("main") {
                let w = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = w.hide();
                    }
                });
            }

            // 💡 2. 非同期ループへ渡すためにトレイハンドルをクローン
            let tray_handle = tray.clone();

            // 💡 起動直後に1回即時実行し、その後は10秒周期で詰まらせずに回します
            tauri::async_runtime::spawn(async move {
                loop {
                    // 1. バッテリー状態の取得（PowerShell動的クエリ）
                    let level = crate::xbox::get_battery_level();

                    // 2. フロントエンドへの通知 ＆ ツールチップの文字列生成
                    let tooltip_text = match level {
                        Some(l) => {
                            // 💡 変更: Some(l) でくるんで送る
                            let _ = app_handle.emit("battery-level", Some(l));
                            format!("現在の残量: {}%", l)
                        }
                        None => {
                            // 💡 変更: 未接続時は None を送る（JS側では null になる）
                            let _ = app_handle.emit("battery-level", None::<u8>);
                            "コントローラ未接続".to_string()
                        }
                    };

                    // 💡 3. トレイのツールチップを動的に更新
                    let _ = tray_handle.set_tooltip(Some(tooltip_text));

                    // 3. 次のチェックまで10秒待機（過負荷によるNone詰まりを完全に防止）
                    tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}