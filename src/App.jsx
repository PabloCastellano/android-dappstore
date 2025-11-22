import React from 'react'
import Home from './pages/Home'

export default function App() {
  return (
    <div className="min-h-screen p-6">
      <header className="max-w-6xl mx-auto mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Decentralized App Store</h1>
          <div className="flex gap-4 items-center">
            <input className="border rounded px-3 py-2" placeholder="Buscar apps..." />
            <button className="px-3 py-2 bg-blue-600 text-white rounded">Connect Wallet</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <Home />
      </main>
    </div>
  )
}
