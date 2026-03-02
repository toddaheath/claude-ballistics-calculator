import { useState, useEffect, useCallback, useRef, lazy, Suspense, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import CartridgeSelector from './components/CartridgeSelector';
import UnitToggle from './components/UnitToggle';
import EnvironmentPanel from './components/EnvironmentPanel';
import TrajectoryChart from './components/TrajectoryChart';
import TrajectoryInfo from './components/TrajectoryInfo';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getCartridges, calculateTrajectory } from './services/api';
import type { Cartridge, EnvironmentSettings, TrajectoryResponse, UnitSystem } from './types';
import './App.css';

const CartridgeReference = lazy(() => import('./pages/CartridgeReference'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const CustomCartridgePage = lazy(() => import('./pages/CustomCartridgePage'));

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

const DEFAULT_MAX_RANGE = 150;

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; isChunkError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }
  static getDerivedStateFromError(error: Error) {
    const isChunk = error.name === 'ChunkLoadError' || error.message?.includes('Failed to fetch dynamically imported module');
    return { hasError: true, isChunkError: isChunk };
  }
  componentDidCatch(error: Error, info: ErrorInfo) { if (import.meta.env.DEV) console.error('ErrorBoundary caught:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error error-boundary" role="alert">
          <h2>{this.state.isChunkError ? 'Failed to load page.' : 'Something went wrong.'}</h2>
          <p>{this.state.isChunkError ? 'Check your network connection and try again.' : 'An unexpected error occurred.'}</p>
          <button type="button" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Calculator() {
  const [cartridges, setCartridges] = useState<Cartridge[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('yards');
  const [maxRange, setMaxRange] = useState(DEFAULT_MAX_RANGE);
  const [trajectory, setTrajectory] = useState<TrajectoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<EnvironmentSettings>({
    windSpeedMph: 0,
    windDirectionDeg: 90,
    temperatureF: 59,
    altitudeFt: 0,
    pressureInHg: 29.92,
    humidityPercent: 0,
    zeroRange: 100,
    sightHeightInches: 1.5,
    shotHeightInches: 30,
    shootingAngleDeg: 0,
    dragModel: 'G1',
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const controller = new AbortController();
    getCartridges()
      .then(setCartridges)
      .catch(() => { if (!controller.signal.aborted) setError('Failed to load cartridges'); });
    return () => controller.abort();
  }, []);

  const fetchTrajectory = useCallback(async (cartridgeId: number, unit: UnitSystem, range: number) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const s = settingsRef.current;
      const result = await calculateTrajectory({
        cartridgeId,
        unitSystem: unit,
        maxRange: range,
        zeroRange: s.zeroRange,
        shotHeightInches: s.shotHeightInches,
        sightHeightInches: s.sightHeightInches,
        windSpeedMph: s.windSpeedMph,
        windDirectionDeg: s.windDirectionDeg,
        temperatureF: s.temperatureF,
        altitudeFt: s.altitudeFt,
        pressureInHg: s.pressureInHg,
        humidityPercent: s.humidityPercent,
        shootingAngleDeg: s.shootingAngleDeg,
        dragModel: s.dragModel,
      });
      if (!controller.signal.aborted) {
        setTrajectory(result);
      }
    } catch {
      if (!controller.signal.aborted) {
        setError('Failed to calculate trajectory');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const handleCartridgeSelect = useCallback((id: number) => {
    setSelectedId(id);
    fetchTrajectory(id, unitSystem, maxRange);
  }, [fetchTrajectory, unitSystem, maxRange]);

  const handleUnitChange = useCallback((unit: UnitSystem) => {
    setUnitSystem(unit);
    if (selectedId) {
      fetchTrajectory(selectedId, unit, maxRange);
    }
  }, [fetchTrajectory, selectedId, maxRange]);

  const handleMaxRangeChange = useCallback((range: number) => {
    setMaxRange(range);
    if (selectedId) {
      fetchTrajectory(selectedId, unitSystem, range);
    }
  }, [fetchTrajectory, selectedId, unitSystem]);

  const handleSettingsChange = useCallback((newSettings: EnvironmentSettings) => {
    setSettings(newSettings);
    settingsRef.current = newSettings;
    if (selectedId) {
      fetchTrajectory(selectedId, unitSystem, maxRange);
    }
  }, [fetchTrajectory, selectedId, unitSystem, maxRange]);

  return (
    <>
      <div className="page-header">
        <h2>Trajectory Calculator</h2>
        <p>Select a cartridge to view its trajectory. Shot from {settings.shotHeightInches}&quot; height, zeroed at {settings.zeroRange} yards.</p>
      </div>

      <div className="controls">
        <CartridgeSelector
          cartridges={cartridges}
          selectedId={selectedId}
          onSelect={handleCartridgeSelect}
        />
        <UnitToggle unitSystem={unitSystem} onChange={handleUnitChange} />
      </div>

      <EnvironmentPanel settings={settings} onChange={handleSettingsChange} />

      {error && <div className="error" role="alert">{error}</div>}
      {loading && <div className="loading" role="status" aria-live="polite">Calculating trajectory...</div>}

      {trajectory && !loading && (
        <>
          <TrajectoryChart
            data={trajectory}
            maxRange={maxRange}
            unitSystem={unitSystem}
            onMaxRangeChange={handleMaxRangeChange}
          />
          <TrajectoryInfo data={trajectory} settings={settings} cartridgeId={selectedId!} maxRange={maxRange} />
        </>
      )}
    </>
  );
}

function NavAuth() {
  const { isAuthenticated, user, logout } = useAuth();
  if (isAuthenticated && user) {
    return (
      <div className="nav-user">
        <span className="nav-user-email">{user.email}</span>
        <button type="button" className="nav-logout-btn" onClick={logout}>Logout</button>
      </div>
    );
  }
  return (
    <>
      <NavLink to="/login" className={({ isActive }) => isActive ? 'nav-link nav-active' : 'nav-link'}>
        Sign In
      </NavLink>
      <NavLink to="/register" className={({ isActive }) => isActive ? 'nav-link nav-active' : 'nav-link'}>
        Register
      </NavLink>
    </>
  );
}

function AppLayout() {
  return (
    <HashRouter>
      <div className="app">
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        {isDemoMode && (
          <div className="demo-banner" role="status">
            Demo Mode — showing sample data. Deploy the full stack for live calculations.
          </div>
        )}
        <header>
          <div className="site-title">
            <h1>Ballistics Calculator</h1>
          </div>
          <nav className="site-nav" aria-label="Main navigation">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link nav-active' : 'nav-link'}>
              Calculator
            </NavLink>
            <NavLink to="/cartridges" className={({ isActive }) => isActive ? 'nav-link nav-active' : 'nav-link'}>
              Cartridge Reference
            </NavLink>
            <NavLink to="/compare" className={({ isActive }) => isActive ? 'nav-link nav-active' : 'nav-link'}>
              Compare
            </NavLink>
            <NavLink to="/custom" className={({ isActive }) => isActive ? 'nav-link nav-active' : 'nav-link'}>
              Custom Load
            </NavLink>
            <NavLink to="/how-it-works" className={({ isActive }) => isActive ? 'nav-link nav-active' : 'nav-link'}>
              How It Works
            </NavLink>
            <NavAuth />
          </nav>
        </header>

        <main id="main-content">
          <Suspense fallback={<div className="loading" role="status" aria-live="polite">Loading...</div>}>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
              <Route path="/cartridges" element={<CartridgeReference />} />
              <Route path="/compare" element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
              <Route path="/custom" element={<ProtectedRoute><CustomCartridgePage /></ProtectedRoute>} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>

        <footer className="site-footer">
          <p>Ballistics Calculator &mdash; RK4 trajectory engine with G1/G7 drag models</p>
        </footer>
      </div>
    </HashRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
