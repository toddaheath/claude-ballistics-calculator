import { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import CartridgeSelector from './components/CartridgeSelector';
import UnitToggle from './components/UnitToggle';
import TrajectoryChart from './components/TrajectoryChart';
import TrajectoryInfo from './components/TrajectoryInfo';
import ProtectedRoute from './components/ProtectedRoute';
import CartridgeReference from './pages/CartridgeReference';
import HowItWorks from './pages/HowItWorks';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getCartridges, calculateTrajectory } from './services/api';
import type { Cartridge, TrajectoryResponse } from './types';
import './App.css';

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

const DEFAULT_MAX_RANGE = 150;

function Calculator() {
  const [cartridges, setCartridges] = useState<Cartridge[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [unitSystem, setUnitSystem] = useState('yards');
  const [maxRange, setMaxRange] = useState(DEFAULT_MAX_RANGE);
  const [trajectory, setTrajectory] = useState<TrajectoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCartridges()
      .then(setCartridges)
      .catch(() => setError('Failed to load cartridges'));
  }, []);

  const fetchTrajectory = useCallback(async (cartridgeId: number, unit: string, range: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await calculateTrajectory({
        cartridgeId,
        unitSystem: unit,
        maxRange: range,
      });
      setTrajectory(result);
    } catch {
      setError('Failed to calculate trajectory');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCartridgeSelect = (id: number) => {
    setSelectedId(id);
    fetchTrajectory(id, unitSystem, maxRange);
  };

  const handleUnitChange = (unit: string) => {
    setUnitSystem(unit);
    if (selectedId) {
      fetchTrajectory(selectedId, unit, maxRange);
    }
  };

  const handleMaxRangeChange = (range: number) => {
    setMaxRange(range);
    if (selectedId) {
      fetchTrajectory(selectedId, unitSystem, range);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Trajectory Calculator</h2>
        <p>Select a cartridge to view its trajectory. Shot from 30" (picnic table height), zeroed at 100 yards.</p>
      </div>

      <div className="controls">
        <CartridgeSelector
          cartridges={cartridges}
          selectedId={selectedId}
          onSelect={handleCartridgeSelect}
        />
        <UnitToggle unitSystem={unitSystem} onChange={handleUnitChange} />
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Calculating trajectory...</div>}

      {trajectory && !loading && (
        <>
          <TrajectoryChart
            data={trajectory}
            maxRange={maxRange}
            onMaxRangeChange={handleMaxRangeChange}
          />
          <TrajectoryInfo data={trajectory} />
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
        <button className="nav-logout-btn" onClick={logout}>Logout</button>
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
        {isDemoMode && (
          <div className="demo-banner">
            Demo Mode — showing sample data. Deploy the full stack for live calculations.
          </div>
        )}
        <header>
          <div className="site-title">
            <h1>Ballistics Calculator</h1>
          </div>
          <nav className="site-nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link nav-active' : 'nav-link'}>
              Calculator
            </NavLink>
            <NavLink to="/cartridges" className={({ isActive }) => isActive ? 'nav-link nav-active' : 'nav-link'}>
              Cartridge Reference
            </NavLink>
            <NavLink to="/how-it-works" className={({ isActive }) => isActive ? 'nav-link nav-active' : 'nav-link'}>
              How It Works
            </NavLink>
            <NavAuth />
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
            <Route path="/cartridges" element={<CartridgeReference />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}

export default App;
