interface WarningPanelProps {
  compact?: boolean;
}

export function WarningPanel({ compact = false }: WarningPanelProps) {
  return (
    <section className={`warning-panel ${compact ? 'compact' : ''}`}>
      <h2>Before You Start</h2>
      <ul>
        <li>
          This is an advocacy-forward awareness simulator inspired by reported lived experiences. It is a
          simplified approximation for perspective and discussion.
        </li>
        <li>
          Experiences vary significantly across autistic non-speakers and others with similar communication
          differences.
        </li>
        <li>This is not a diagnostic, treatment, or medical device tool.</li>
        <li>
          Audio effects may include buzzing, tone overlap, and contrast changes. Lower your speaker or
          headphone volume before starting.
        </li>
      </ul>
    </section>
  );
}
