// src/App.jsx
import React, { useState } from "react";
import HomePage from "./HomePage.jsx";
import MenuPage from "./MenuPage.jsx";
import PivotGame from "./PivotGame.jsx";

export default function App() {
  // 'landing' → 'menu' → game (mode object)
  const [screen, setScreen] = useState('landing');
  const [mode, setMode] = useState(null);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-zinc-50 via-white to-zinc-100">
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        {screen === 'landing' && (
          <HomePage onContinue={() => setScreen('menu')} />
        )}
        {screen === 'menu' && (
          <MenuPage
            onSelect={(m) => { setMode(m); setScreen('game'); }}
            onBack={() => setScreen('landing')}
          />
        )}
        {screen === 'game' && mode && (
          <PivotGame mode={mode} onExit={() => setScreen('menu')} />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 text-center text-sm text-zinc-600 backdrop-blur">
          Made by Manav, Armaan and Aarmen, share your chain with friends
        </div>
      </footer>
    </div>
  );
}
