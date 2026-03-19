interface SimulationControlsProps {
  paused: boolean;
  muted: boolean;
  settingsOpen: boolean;
  fullscreenActive: boolean;
  variant?: 'default' | 'fullscreen';
  onTogglePause: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onToggleSettings: () => void;
  onToggleFullscreen: () => void;
  onReturnToSetup: () => void;
  onOpenDebrief: () => void;
}

export function SimulationControls({
  paused,
  muted,
  settingsOpen,
  fullscreenActive,
  variant = 'default',
  onTogglePause,
  onRestart,
  onToggleMute,
  onToggleSettings,
  onToggleFullscreen,
  onReturnToSetup,
  onOpenDebrief,
}: SimulationControlsProps) {
  const fullscreenMode = variant === 'fullscreen';

  return (
    <div className={`simulation-controls ${fullscreenMode ? 'simulation-controls-overlay' : ''}`}>
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
      <button type="button" onClick={onToggleFullscreen}>
        {fullscreenActive ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      </button>
      <button type="button" onClick={onReturnToSetup}>
        {fullscreenMode ? 'Setup' : 'Return to Setup'}
      </button>
      <button type="button" className="primary-button" onClick={onOpenDebrief}>
        {fullscreenMode ? 'End Simulation' : 'Reflection'}
      </button>
    </div>
  );
}
