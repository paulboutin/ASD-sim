interface SimulationControlsProps {
  paused: boolean;
  muted: boolean;
  settingsOpen: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onToggleSettings: () => void;
  onReturnToSetup: () => void;
  onOpenDebrief: () => void;
}

export function SimulationControls({
  paused,
  muted,
  settingsOpen,
  onTogglePause,
  onRestart,
  onToggleMute,
  onToggleSettings,
  onReturnToSetup,
  onOpenDebrief,
}: SimulationControlsProps) {
  return (
    <div className="simulation-controls">
      <button type="button" onClick={onTogglePause}>
        {paused ? 'Resume' : 'Pause'}
      </button>
      <button type="button" onClick={onRestart}>
        Restart
      </button>
      <button type="button" onClick={onToggleMute}>
        {muted ? 'Unmute Audio' : 'Mute Audio'}
      </button>
      <button type="button" onClick={onToggleSettings}>
        {settingsOpen ? 'Hide Settings' : 'Open Settings'}
      </button>
      <button type="button" onClick={onReturnToSetup}>
        Return to Setup
      </button>
      <button type="button" className="primary-button" onClick={onOpenDebrief}>
        Reflection
      </button>
    </div>
  );
}
