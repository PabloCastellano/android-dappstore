import React from 'react'
import AppIcon from './AppIcon'

export default function AppCard({ app }) {
  return (
    <div className="p-4 border rounded-lg shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow relative">
      <AppIcon 
        src={app.icon}
        alt={app.name}
        slug={app.slug}
        category={app.category}
        size="lg"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="font-semibold">{app.name}</div>
          {app.onChain && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" title="Registrada en blockchain">
              ⛓️ On-Chain
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500">{app.price}</div>
        {app.totalDownloads !== undefined && app.totalDownloads > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            📥 {app.totalDownloads} descargas
          </div>
        )}
      </div>
    </div>
  )
}
