import React from 'react';

const ModernLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
      <span className="text-lg font-semibold text-[var(--text-accent)]">Refreshing data...</span>
    </div>
  </div>
);

export default ModernLoader;
