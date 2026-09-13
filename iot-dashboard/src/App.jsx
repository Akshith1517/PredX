import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard    from './pages/Dashboard';
import LiveSensors  from './pages/LiveSensors';
import MachineHealth from './pages/MachineHealth';
import Analytics    from './pages/Analytics';
import Alerts       from './pages/Alerts';
import Settings     from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/"           element={<Dashboard />}    />
            <Route path="/live"       element={<LiveSensors />}  />
            <Route path="/health"     element={<MachineHealth />} />
            <Route path="/analytics"  element={<Analytics />}    />
            <Route path="/alerts"     element={<Alerts />}       />
            <Route path="/settings"   element={<Settings />}     />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
