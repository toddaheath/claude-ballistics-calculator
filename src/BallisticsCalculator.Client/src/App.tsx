import { useState, useEffect, useCallback } from 'react';
import CartridgeSelector from './components/CartridgeSelector';
import UnitToggle from './components/UnitToggle';
import TrajectoryChart from './components/TrajectoryChart';
import TrajectoryInfo from './components/TrajectoryInfo';
import { getCartridges, calculateTrajectory } from './services/api';
import type { Cartridge, TrajectoryResponse } from './types';
import './App.css';

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

function App() {
  const [cartridges, setCartridges] = useState<Cartridge[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [unitSystem, setUnitSystem] = useState('yards');
  const [trajectory, setTrajectory] = useState<TrajectoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCartridges()
      .then(setCartridges)
      .catch(() => setError('Failed to load cartridges'));
  }, []);

  const fetchTrajectory = useCallback(async (cartridgeId: number, unit: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await calculateTrajectory({
        cartridgeId,
        unitSystem: unit,
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
    fetchTrajectory(id, unitSystem);
  };

  const handleUnitChange = (unit: string) => {
    setUnitSystem(unit);
    if (selectedId) {
      fetchTrajectory(selectedId, unit);
    }
  };

  return (
    <div className="app">
      {isDemoMode && (
        <div className="demo-banner">
          Demo Mode — showing sample data. Deploy the full stack for live calculations.
        </div>
      )}
      <header>
        <h1>Ballistics Calculator</h1>
        <p>Select a cartridge to view its trajectory. Shot from 30" (picnic table height), zeroed at 100 yards.</p>
      </header>

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
          <TrajectoryChart data={trajectory} />
          <TrajectoryInfo data={trajectory} />
        </>
      )}
    </div>
  );
}

export default App;
