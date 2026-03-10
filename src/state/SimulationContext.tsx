/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { DEFAULT_LEVELS } from '../config/channels';
import type { ChannelKey, ChannelLevels, DebriefSnapshot, TestId } from '../types/simulation';

interface SimulationState {
  channels: ChannelLevels;
  selectedTest: TestId;
  warningsAccepted: boolean;
  muted: boolean;
  paused: boolean;
  restartNonce: number;
  debriefSnapshot: DebriefSnapshot | null;
}

type Action =
  | { type: 'set-channel'; key: ChannelKey; value: number }
  | { type: 'set-test'; testId: TestId }
  | { type: 'reset-channels' }
  | { type: 'apply-levels'; levels: ChannelLevels }
  | { type: 'accept-warnings' }
  | { type: 'set-muted'; muted: boolean }
  | { type: 'set-paused'; paused: boolean }
  | { type: 'restart-session' }
  | { type: 'save-debrief'; payload: DebriefSnapshot }
  | { type: 'clear-debrief' };

const initialState: SimulationState = {
  channels: DEFAULT_LEVELS,
  selectedTest: 'symbol-selection',
  warningsAccepted: false,
  muted: true,
  paused: false,
  restartNonce: 0,
  debriefSnapshot: null,
};

function simulationReducer(state: SimulationState, action: Action): SimulationState {
  switch (action.type) {
    case 'set-channel':
      return {
        ...state,
        channels: {
          ...state.channels,
          [action.key]: action.value,
        },
      };
    case 'set-test':
      return {
        ...state,
        selectedTest: action.testId,
      };
    case 'reset-channels':
      return {
        ...state,
        channels: DEFAULT_LEVELS,
      };
    case 'apply-levels':
      return {
        ...state,
        channels: action.levels,
      };
    case 'accept-warnings':
      return {
        ...state,
        warningsAccepted: true,
      };
    case 'set-muted':
      return {
        ...state,
        muted: action.muted,
      };
    case 'set-paused':
      return {
        ...state,
        paused: action.paused,
      };
    case 'restart-session':
      return {
        ...state,
        paused: false,
        restartNonce: state.restartNonce + 1,
      };
    case 'save-debrief':
      return {
        ...state,
        debriefSnapshot: action.payload,
      };
    case 'clear-debrief':
      return {
        ...state,
        debriefSnapshot: null,
      };
    default:
      return state;
  }
}

interface SimulationContextValue {
  state: SimulationState;
  setChannel: (key: ChannelKey, value: number) => void;
  setTest: (testId: TestId) => void;
  resetChannels: () => void;
  applyLevels: (levels: ChannelLevels) => void;
  acceptWarnings: () => void;
  setMuted: (muted: boolean) => void;
  setPaused: (paused: boolean) => void;
  restartSession: () => void;
  saveDebrief: (snapshot: DebriefSnapshot) => void;
  clearDebrief: () => void;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(simulationReducer, initialState);

  const setChannel = useCallback((key: ChannelKey, value: number) => {
    dispatch({ type: 'set-channel', key, value: Math.max(0, Math.min(100, Math.round(value))) });
  }, []);

  const value = useMemo<SimulationContextValue>(
    () => ({
      state,
      setChannel,
      setTest: (testId) => dispatch({ type: 'set-test', testId }),
      resetChannels: () => dispatch({ type: 'reset-channels' }),
      applyLevels: (levels) => dispatch({ type: 'apply-levels', levels }),
      acceptWarnings: () => dispatch({ type: 'accept-warnings' }),
      setMuted: (muted) => dispatch({ type: 'set-muted', muted }),
      setPaused: (paused) => dispatch({ type: 'set-paused', paused }),
      restartSession: () => dispatch({ type: 'restart-session' }),
      saveDebrief: (payload) => dispatch({ type: 'save-debrief', payload }),
      clearDebrief: () => dispatch({ type: 'clear-debrief' }),
    }),
    [setChannel, state],
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation(): SimulationContextValue {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return context;
}
