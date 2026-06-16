import BatteryGauge from "../../components/BatteryGauge";
import ThresholdRow from "../../components/ThresholdRow";
import { useState, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import storage from "../../components/Hooks/storage"; 

function Home() {
  // 💡 初期値として LocalStorage から現在の設定を読み込む
  const [thresholds, setThresholds] = useState<(number | null)[]>(() => storage.get());
  
  // 💡 1. 初期値を null（未接続）にし、型を number | null に拡張します
  const [level, setLevel] = useState<number | null>(null);

  // 💡 前回のバッテリーレベル（ここも number | null に対応）
  const lastLevelRef = useRef<number | null>(null);

  // 💡 セレクタが変わったら、状態更新と同時にLocalStorageへ保存
  const updateThreshold = (index: number, value: number | null) => {
    const next = [...thresholds];
    next[index] = value;
    setThresholds(next);
    
    // storage.tsの型（タプル型など）に合わせるため、型アサーションを入れて保存
    storage.set(next as [number | null, number | null, number | null]);
  };

  useEffect(() => {
    // 💡 2. event.payload の型アサーションを number | null に変更
    let unlistenPromise = listen("battery-level", async (event) => {
      const currentLevel = event.payload as number | null;
      
      // 💡 状態を更新する前に、「前回の値」を変数に逃がしておく
      const previousLevel = lastLevelRef.current;

      setLevel(currentLevel);

      // 【重複ガード】前回と同じ状態ならスキップ（両方 null、または同じ数値の場合）
      if (currentLevel === previousLevel) {
        return;
      }
      lastLevelRef.current = currentLevel;

      // 💡 3. 今回の受信が null（未接続）なら、通知の判定をスキップする
      if (currentLevel === null) {
        return;
      }

      // ユーザーが設定した有効な閾値（null 以外）だけを取り出して配列にする
      const activeThresholds = thresholds.filter((t): t is number => t !== null);

      // 💡 【重要】ピッタリ一致ではなく、「前回は閾値より上で、今回は閾値以下になったか（跨いだか）」を判定
      // (previousLevel が null のとき（＝未接続から復帰した時）は、前回の値がわからないので通知をスキップするように安全弁を設けています)
      const crossedThresholds = activeThresholds.filter(
        (threshold) => previousLevel !== null && previousLevel > threshold && currentLevel <= threshold
      );

      // 1つでもまたいだ閾値があれば通知を出す
      if (crossedThresholds.length > 0) {
        // 一番高い閾値を通知文面に使う
        const triggeredThreshold = Math.max(...crossedThresholds);

        try {
          // 1. OSの通知許可があるか確認
          let permissionGranted = await isPermissionGranted();
          if (!permissionGranted) {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
          }

          // 2. 許可されていれば通知を発火
          if (permissionGranted) {
            sendNotification({
              title: "Xbox コントローラー",
              body: `バッテリー残量が ${triggeredThreshold}% を下回りました（現在: ${currentLevel}%）`,
            });
          }
        } catch (err) {
          console.error("Notification error:", err);
        }
      }
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [thresholds]); // thresholdsが変わる度リスナーが最新の設定を参照できるように再登録

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      {/* 💡 BatteryGauge に渡す level が number | null になりました */}
      <BatteryGauge level={level} />

      <h3 style={{ marginTop: 40 }}>通知する残量</h3>

      <ThresholdRow values={thresholds} onChange={updateThreshold} />
    </div>
  );
}

export default Home;