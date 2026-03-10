export function AboutPage() {
  return (
    <main className="page">
      <section className="panel">
        <h1>About / Method</h1>
        <p>
          ASD-sim is designed as a knowledge-sharing and awareness tool. It presents a structured approximation
          of communication and sensory-motor interference inspired by self-advocate and community-reported
          experiences.
        </p>
      </section>

      <section className="panel">
        <h2>Boundaries</h2>
        <ul>
          <li>Not a game, diagnosis system, or treatment device.</li>
          <li>Not a claim of exact reproduction of any person&apos;s internal experience.</li>
          <li>Not an attempt to represent all autistic non-speakers as a single profile.</li>
        </ul>
      </section>

      <section className="panel">
        <h2>Current MVP Focus</h2>
        <ul>
          <li>Global channel sliders for five interference categories.</li>
          <li>Three modular simulation tests built for expansion.</li>
          <li>Query-string presets for shareable educational setups.</li>
          <li>No backend and no personal data storage.</li>
        </ul>
      </section>

      <section className="panel">
        <h2>Future Direction</h2>
        <p>
          Future presets may be informed by individual profiles only when shared with permission. Any additions
          should preserve respectful framing and educational purpose.
        </p>
      </section>
    </main>
  );
}
