import "./style.css";

type Props = {
    level: number  | null; // 0〜100
};

function BatteryGauge({ level }: Props) {
    // 💡 残量に応じて色を動的に変える（Xbox風グリーン / オレンジ / 赤）
    const getGaugeColor = (lvl: number | null) => {
        if (lvl === null) return "#999"; // 未接続時はグレー
        if (lvl <= 10) return "#f44336"; // EMPTY(10%) は赤
        if (lvl <= 20) return "#ff9800"; // LOW(20%) はオレンジ
        return "#4caf50";                // 通常時はグリーン
    };

    const gaugeColor = getGaugeColor(level);

    return (
        <div className="gauge-wrapper">
            <div className="gauge"
                style={{
                    // 💡 動的に決まった色（gaugeColor）を適用
                    background: `conic-gradient(${gaugeColor} ${level !== null ? level * 3.6 : 0}deg, #333 0deg)`
                }} >
                <div className="gauge-center" style={{ color: level !== null && level <= 20 ? gaugeColor : "#fff" }}>
                    {level !== null ? `${level}%` : "未接続"}
                </div>
            </div>
        </div>
    );
}

export default BatteryGauge;