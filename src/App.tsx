import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { AboutPage } from './pages/AboutPage';
import { DebriefPage } from './pages/DebriefPage';
import { HomePage } from './pages/HomePage';
import { SetupPage } from './pages/SetupPage';
import { SimulationPage } from './pages/SimulationPage';

export default function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div>
          <p className="eyebrow">Awareness Simulator</p>
          <h1>ASD-sim</h1>
        </div>
        <nav aria-label="Primary">
          <NavLink to="/" end>
            Intro
          </NavLink>
          <NavLink to="/setup">Setup</NavLink>
          <NavLink to="/simulate">Simulation</NavLink>
          <NavLink to="/debrief">Reflection</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/simulate" element={<SimulationPage />} />
        <Route path="/debrief" element={<DebriefPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
