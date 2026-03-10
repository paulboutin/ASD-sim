import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WarningPanel } from '../components/WarningPanel';
import { useSimulation } from '../state/SimulationContext';

export function HomePage() {
  const navigate = useNavigate();
  const { state, acceptWarnings } = useSimulation();
  const [acknowledged, setAcknowledged] = useState(state.warningsAccepted);

  const handleStart = (): void => {
    acceptWarnings();
    navigate('/setup');
  };

  return (
    <main className="page">
      <section className="hero-card">
        <p className="eyebrow">ASD-sim</p>
        <h1>Perspective-Building Awareness Simulator</h1>
        <p>
          ASD-sim is an educational, advocacy-forward simulation environment designed for discussion and
          knowledge sharing. It approximates how layered sensory, perceptual, and motor-planning interference can
          impact communication tasks.
        </p>
        <p>
          The simulator is inspired by reported lived experiences. It does not claim to exactly reproduce any
          person&apos;s internal experience.
        </p>
        <div className="action-row">
          <label className="ack-row">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            <span>I understand the purpose, limitations, and audio warning.</span>
          </label>
          <button type="button" className="primary-button" disabled={!acknowledged} onClick={handleStart}>
            Start Setup
          </button>
        </div>
      </section>

      <WarningPanel />
    </main>
  );
}
