type Sample = {
  id: string;
  label: string;
  mime_type: string;
};

type Props = {
  samples: Sample[];
  loading: boolean;
  activeSampleId: string | null;
  onSelect: (sample: Sample) => void;
};

export function SamplePicker({ samples, loading, activeSampleId, onSelect }: Props) {
  if (loading && samples.length === 0) {
    return <p className="muted">Loading sample receipts…</p>;
  }

  if (!loading && samples.length === 0) {
    return <p className="muted">No samples found yet.</p>;
  }

  return (
    <div className="sample-list">
      {samples.map((sample) => (
        <button
          key={sample.id}
          type="button"
          className={`sample-button ${activeSampleId === sample.id ? "sample-button--active" : ""}`}
          onClick={() => onSelect(sample)}
        >
          {sample.label}
        </button>
      ))}
    </div>
  );
}
