import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../state/SimulationContext';

export function DebriefPage() {
  const navigate = useNavigate();
  const {
    state: { debriefSnapshot },
    clearDebrief,
  } = useSimulation();

  if (!debriefSnapshot) {
    return (
      <main className="page">
        <section className="panel">
          <h1>Reflection / Debrief</h1>
          <p>No active session snapshot is available yet. Run a simulation first.</p>
          <button type="button" className="primary-button" onClick={() => navigate('/simulate')}>
            Go to Simulation
          </button>
        </section>
      </main>
    );
  }

  const scoredResponses = debriefSnapshot.responses + debriefSnapshot.incorrectResponses;
  const percentCorrect = scoredResponses === 0 ? 0 : Math.round((debriefSnapshot.responses / scoredResponses) * 100);

  return (
    <main className="page">
      <section className="panel">
        <h1>Reflection / Debrief</h1>
        <p>
          This simulation is a simplified approximation intended for perspective-building and discussion. It does
          not represent every autistic non-speaker&apos;s experience and should not be interpreted as medical truth.
        </p>
      </section>

      <section className="panel">
        <h2>Session Summary</h2>
        <p>Test: {debriefSnapshot.testTitle}</p>
        <ul>
          <li>Attempts: {debriefSnapshot.attempts}</li>
          <li>Incorrect responses: {debriefSnapshot.incorrectResponses}</li>
          <li>Disruptions observed: {debriefSnapshot.disruptions}</li>
          <li>Percent correct: {percentCorrect}%</li>
        </ul>
      </section>

      <section className="panel">
        <h2>Channel Configuration Used</h2>
        <ul>
          <li>Apraxia / Motor-planning: {debriefSnapshot.channelLevels.apraxia}</li>
          <li>Need to Stim / Involuntary disruption: {debriefSnapshot.channelLevels.stim}</li>
          <li>Hearing distortions: {debriefSnapshot.channelLevels.hearing}</li>
          <li>Vision distortions: {debriefSnapshot.channelLevels.vision}</li>
          <li>Cross-sensory interference: {debriefSnapshot.channelLevels.synesthesia}</li>
          <li>Prompt voice volume: {debriefSnapshot.audioMixLevels.promptVoice}</li>
          <li>Distraction audio volume: {debriefSnapshot.audioMixLevels.distortion}</li>
          <li>Intrusive-thought volume: {debriefSnapshot.audioMixLevels.intrusiveThoughts}</li>
          <li>Visual blur mix: {debriefSnapshot.visualMixLevels.blur}</li>
          <li>Visual ghosting mix: {debriefSnapshot.visualMixLevels.ghosting}</li>
          <li>Visual noise mix: {debriefSnapshot.visualMixLevels.noise}</li>
          <li>Visual lens mix: {debriefSnapshot.visualMixLevels.convex}</li>
          <li>Visual flicker mix: {debriefSnapshot.visualMixLevels.flicker}</li>
          <li>Intrusive-thought audio: {debriefSnapshot.intrusiveThoughtsEnabled ? 'Enabled' : 'Disabled'}</li>
        </ul>
      </section>

      <section className="panel">
        <h2>Observed Interference Notes</h2>
        {debriefSnapshot.notes.length ? (
          <ul>
            {debriefSnapshot.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : (
          <p>No notes were captured for this run.</p>
        )}
      </section>

      <div className="page-footer-actions">
        <button type="button" onClick={() => navigate('/setup')}>
          Return to Setup
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            clearDebrief();
            navigate('/simulate');
          }}
        >
          Run Again
        </button>
      </div>
    </main>
  );
}
