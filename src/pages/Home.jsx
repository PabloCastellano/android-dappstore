import React from 'react'
import AppCard from '../components/AppCard'

// ejemplo estático: en un proyecto real, trae los datos del subgraph / contract
const MOCK_APPS = [
  { slug: 'dicegame', name: 'DiceGame', price: 'Free', icon: '/mockup-assets/dice.png' },
  { slug: 'chatty', name: 'Chatty', price: '0.1 ETH', icon: '/mockup-assets/chatty.png' },
  { slug: 'taskmaster', name: 'TaskMaster', price: 'Free', icon: '/mockup-assets/task.png' },
  { slug: 'smiles', name: 'Smiles', price: '2.5 ETH', icon: '/mockup-assets/smiles.png' }
]

export default function Home({ wallet }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="grid grid-cols-12 gap-6">
      <section className="col-span-8 bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Popular</h2>
        <div className="grid grid-cols-2 gap-4">
          {MOCK_APPS.map(a => (
            <AppCard key={a.slug} app={a} />
          ))}
        </div>
      </section>

      <aside className="col-span-4 bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">App details</h2>
        {/* Usa la imagen mockup que subiste para mostrar un preview visual */}
        <img src="/mnt/data/A_2D_digital_screenshot_of_a_decentralized_app_sto.png" alt="mockup" className="w-full rounded" />

        <div className="mt-4">
          <h3 className="text-lg font-bold">Chatty</h3>
          <p className="text-sm text-gray-600">A decentralized messaging app</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="col-span-2 bg-blue-600 text-white py-3 rounded">Download APK</button>
            <button className="py-2 border rounded">Buy</button>
            <div className="flex items-center justify-center font-semibold">0.1 ETH</div>
          </div>
        </div>
      </aside>
      </div>
    </div>
  )
}
