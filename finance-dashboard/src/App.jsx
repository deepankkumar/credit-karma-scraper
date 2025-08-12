import React, { useEffect } from 'react';
import Dashboard from './Dashboard';
import './index.css';

function App() {
  useEffect(() => {
    // Set light mode by default
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;
