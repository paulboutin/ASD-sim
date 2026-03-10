import { TEST_DEFINITIONS } from '../tests';
import type { TestId } from '../types/simulation';

interface TestSelectorProps {
  selectedTest: TestId;
  onSelect: (testId: TestId) => void;
}

export function TestSelector({ selectedTest, onSelect }: TestSelectorProps) {
  return (
    <section className="panel">
      <h2>Select a Simulation Test</h2>
      <div className="test-selector-grid">
        {TEST_DEFINITIONS.map((test) => (
          <button
            key={test.id}
            type="button"
            className={`test-choice ${selectedTest === test.id ? 'active' : ''}`}
            onClick={() => onSelect(test.id)}
          >
            <strong>{test.label}</strong>
            <span>{test.summary}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
