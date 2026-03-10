import type { ComponentType } from 'react';
import type { TestId } from '../types/simulation';
import { RecognitionTest } from './RecognitionTest';
import { SymbolSelectionTest } from './SymbolSelectionTest';
import type { TestProps } from './TestTypes';
import { TimedFocusTest } from './TimedFocusTest';

export interface TestDefinition {
  id: TestId;
  label: string;
  summary: string;
  component: ComponentType<TestProps>;
}

export const TEST_DEFINITIONS: TestDefinition[] = [
  {
    id: 'symbol-selection',
    label: 'Symbol Selection',
    summary: 'AAC-inspired symbol board targeting under layered interference.',
    component: SymbolSelectionTest,
  },
  {
    id: 'recognition',
    label: 'Object/Color/Shape Recognition',
    summary: 'Prompt recognition with visual, auditory, and response instability.',
    component: RecognitionTest,
  },
  {
    id: 'timed-focus',
    label: 'Timed Focus / Response',
    summary: 'Continuous prompts under interruption pressure and sensory competition.',
    component: TimedFocusTest,
  },
];

export function getTestById(testId: TestId): TestDefinition {
  const found = TEST_DEFINITIONS.find((item) => item.id === testId);
  if (!found) {
    return TEST_DEFINITIONS[0];
  }
  return found;
}
