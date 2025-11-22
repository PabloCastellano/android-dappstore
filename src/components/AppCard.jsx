import React from 'react'

export default function AppCard({ app }) {
  return (
    <div className="p-4 border rounded-lg shadow-sm flex items-center gap-4">
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
        <img src={app.icon} alt="icon" className="w-10 h-10" />
      </div>
      <div>
        <div className="font-semibold">{app.name}</div>
        <div className="text-sm text-gray-500">{app.price}</div>
      </div>
    </div>
  )
}
