import ThresholdSelect from "../ThresholdSelect";

type Props = {
  values: (number | null)[];
  onChange: (index: number, value: number | null) => void;
};

function ThresholdRow({ values, onChange }: Props) {
  return (
    <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
      {values.map((v, i) => (
        <ThresholdSelect
          key={i}
          value={v}
          onChange={(val) => onChange(i, val)}
        />
      ))}
    </div>
  );
}

export default ThresholdRow;
