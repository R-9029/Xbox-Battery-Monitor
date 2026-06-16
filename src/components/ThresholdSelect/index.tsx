type Props = {
  value: number | null; // null = 使わない
  onChange: (v: number | null) => void;
};

const ThresholdSelect = ({ value, onChange }: Props) => {
  // 💡 5%から100%まで、5%刻みの選択肢（20個）を自動生成
  const options = Array.from({ length: 20 }, (_, i) => {
    const percent = (i + 1) * 5; // 5, 10, 15 ... 100
    return {
      label: `${percent}%`,
      value: percent,
    };
  });

  return (
    <select
      value={value === null ? "" : value}
      onChange={(e) => {
        const v = e.target.value === "" ? null : Number(e.target.value);
        onChange(v);
      }}
      style={{
        padding: "8px",
        fontSize: "16px",
        borderRadius: "6px",
        backgroundColor: "#1a1a1a", 
        color: "#fff",
      }}
    >
      {/* 「使わない」を選択した時は null */}
      <option value="">使わない</option>
      
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default ThresholdSelect;