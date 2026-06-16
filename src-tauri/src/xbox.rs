#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
use std::process::Command;

#[cfg(target_os = "windows")]
pub fn get_battery_level() -> Option<u8> {
    let script = r#"
        # バッテリー残量のプロパティキー
        $bt_key = "{104EA319-6EE2-4701-BD47-8DDBF425BBE5} 2"
        # 💡 通信状態（接続中かどうか）のプロパティキー
        $conn_key = "{83DA6326-97A6-4088-9453-A1923F573B29} 15"
        
        $devices = Get-PnpDevice -Class "Bluetooth" -FriendlyName "*Xbox*" -ErrorAction SilentlyContinue
        
        foreach ($d in $devices) {
            # 1. まず「本当に今繋がっているか（Trueか）」を隠しキーで確認する
            $conn_prop = Get-PnpDeviceProperty -InstanceId $d.InstanceId -KeyName $conn_key -ErrorAction SilentlyContinue
            
            # 接続中 (True) でなければ、残量キャッシュが残っていても無視して次へ
            if (-not $conn_prop -or $conn_prop.Data -ne $true) {
                continue
            }

            # 2. 接続中の場合のみ、バッテリーデータを取得して返す
            $prop = Get-PnpDeviceProperty -InstanceId $d.InstanceId -KeyName $bt_key -ErrorAction SilentlyContinue
            if ($prop -and $null -ne $prop.Data) {
                Write-Output $prop.Data
                return
            }
        }
    "#;

    let output = Command::new("powershell")
        .creation_flags(0x08000000) // 黒い画面を出さない
        .args(&["-NoProfile", "-Command", script])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let trimmed = stdout.trim();

    if let Ok(raw_percent) = trimmed.parse::<u8>() {
        return Some(raw_percent);
    }

    None
}

#[cfg(not(target_os = "windows"))]
pub fn get_battery_level() -> Option<u8> {
    None
}