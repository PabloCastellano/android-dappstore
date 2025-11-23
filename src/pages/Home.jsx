import React, { useState, useMemo, useEffect } from 'react'
import AppCard from '../components/AppCard'
import { useAppStore } from '../hooks/useAppStore'

// Apps de ejemplo - se enriquecerán con datos del contrato si existen
// Nota: Todas las apps son gratuitas porque el contrato simplificado no maneja precios
const MOCK_APPS = [
  { slug: 'dicegame', name: 'DiceGame', price: 'Free', icon: '/mockup-assets/dice.png', category: 'games', description: 'Fun dice rolling game' },
  { slug: 'chatty', name: 'Chatty', price: 'Free', icon: '/mockup-assets/chatty.png', category: 'social', description: 'Decentralized messaging' },
  { slug: 'taskmaster', name: 'TaskMaster', price: 'Free', icon: '/mockup-assets/task.png', category: 'productivity', description: 'Task management app' },
  { slug: 'smiles', name: 'Smiles', price: 'Free', icon: '/mockup-assets/smiles.png', category: 'entertainment', description: 'Emoji collection' },
  { slug: 'cryptowallet', name: 'CryptoWallet', price: 'Free', icon: '/mockup-assets/wallet.png', category: 'finance', description: 'Secure crypto wallet' },
  { slug: 'nftgallery', name: 'NFT Gallery', price: 'Free', icon: '/mockup-assets/nft.png', category: 'entertainment', description: 'View your NFTs' },
  { slug: 'defi-tracker', name: 'DeFi Tracker', price: 'Free', icon: '/mockup-assets/defi.png', category: 'finance', description: 'Track DeFi positions' },
  { slug: 'web3-browser', name: 'Web3 Browser', price: 'Free', icon: '/mockup-assets/browser.png', category: 'tools', description: 'Browse Web3' }
]

const CATEGORIES = [
  { id: 'all', name: 'Todas', icon: '📱' },
  { id: 'games', name: 'Juegos', icon: '🎮' },
  { id: 'social', name: 'Social', icon: '💬' },
  { id: 'productivity', name: 'Productividad', icon: '📊' },
  { id: 'entertainment', name: 'Entretenimiento', icon: '🎬' },
  { id: 'finance', name: 'Finanzas', icon: '💰' },
  { id: 'tools', name: 'Herramientas', icon: '🔧' }
]

const PRICE_FILTERS = [
  { id: 'all', name: 'Todos' },
  { id: 'free', name: 'Gratis' },
  { id: 'paid', name: 'De pago' }
]

export default function Home({ wallet, onAppClick }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('popular') // 'popular', 'name', 'price'
  const [apps, setApps] = useState(MOCK_APPS)
  const [loadingContract, setLoadingContract] = useState(false)

  // Hook del contrato
  const { getAllAppsFromContract, enrichAppsWithContractData, isReady } = useAppStore(wallet)

  // Cargar datos del contrato cuando esté listo
  useEffect(() => {
    const loadContractData = async () => {
      if (!isReady) {
        console.log('ℹ️ Contract not ready, showing mock apps')
        setApps(MOCK_APPS)
        return
      }

      setLoadingContract(true)
      try {
        // Intentar obtener todas las apps del contrato
        const contractApps = await getAllAppsFromContract()
        
        if (contractApps.length > 0) {
          // Si hay apps en el contrato, usarlas
          console.log(`✅ Using ${contractApps.length} apps from contract`)
          setApps(contractApps)
        } else {
          // Si no hay apps registradas, enriquecer mocks con datos del contrato
          console.log('ℹ️ No apps in contract, enriching mocks...')
          const enrichedApps = await enrichAppsWithContractData(MOCK_APPS)
          setApps(enrichedApps)
        }
      } catch (err) {
        console.error('Error loading contract data:', err)
        setApps(MOCK_APPS)
      } finally {
        setLoadingContract(false)
      }
    }

    loadContractData()
  }, [isReady, getAllAppsFromContract, enrichAppsWithContractData])

  // Filtrar y ordenar apps
  const filteredApps = useMemo(() => {
    let filtered = [...apps]

    // Búsqueda por nombre o descripción
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query)
      )
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(app => app.category === selectedCategory)
    }

    // Filtrar por precio
    if (selectedPriceFilter === 'free') {
      filtered = filtered.filter(app => app.price === 'Free')
    } else if (selectedPriceFilter === 'paid') {
      filtered = filtered.filter(app => app.price !== 'Free')
    }

    // Ordenar
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => {
        const priceA = a.price === 'Free' ? 0 : parseFloat(a.price)
        const priceB = b.price === 'Free' ? 0 : parseFloat(b.price)
        return priceA - priceB
      })
    }

    return filtered
  }, [apps, searchQuery, selectedCategory, selectedPriceFilter, sortBy])

  // Contar apps del contrato
  const contractAppsCount = apps.filter(app => app.onChain).length

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Contract Status Badge */}
      {isReady && contractAppsCount > 0 && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
          <span className="text-green-600 text-xl">✓</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">
              Conectado al contrato
            </p>
            <p className="text-xs text-green-700">
              {contractAppsCount} de {apps.length} apps cargadas desde blockchain
            </p>
          </div>
          {loadingContract && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
          )}
        </div>
      )}

      {!isReady && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3">
          <span className="text-yellow-600 text-xl">ℹ️</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">
              Modo demo
            </p>
            <p className="text-xs text-yellow-700">
              Mostrando apps de ejemplo. Conecta tu wallet para ver apps reales del contrato.
            </p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
              🔍
            </span>
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="popular">Más populares</option>
            <option value="name">Nombre A-Z</option>
            <option value="price">Precio (menor a mayor)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Filters */}
        <aside className="col-span-3 space-y-6">
          {/* Categories */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Categorías</h3>
            <div className="space-y-2">
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Precio</h3>
            <div className="space-y-2">
              {PRICE_FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedPriceFilter(filter.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    selectedPriceFilter === filter.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          {wallet?.isConnected && (
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 shadow-sm text-white">
              <h3 className="text-lg font-bold mb-2">Tu Cuenta</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="opacity-80">Balance:</span>
                  <p className="font-bold">{wallet.balance.slice(0, 6)} ETH</p>
                </div>
                <div>
                  <span className="opacity-80">Red:</span>
                  <p className="font-medium">{wallet.getNetworkName(wallet.chainId)}</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content - Apps Grid */}
        <section className="col-span-9">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {searchQuery ? `Resultados para "${searchQuery}"` : 
                 selectedCategory !== 'all' ? CATEGORIES.find(c => c.id === selectedCategory)?.name : 
                 'Todas las Apps'}
              </h2>
              <span className="text-sm text-gray-600">
                {filteredApps.length} {filteredApps.length === 1 ? 'app' : 'apps'}
              </span>
            </div>

            {filteredApps.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {filteredApps.map(app => (
                  <div 
                    key={app.slug} 
                    onClick={() => onAppClick && onAppClick(app.slug)} 
                    className="cursor-pointer transform hover:scale-105 transition"
                  >
                    <AppCard app={app} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No se encontraron apps
                </h3>
                <p className="text-gray-600 mb-4">
                  Intenta con otros términos de búsqueda o filtros
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                    setSelectedPriceFilter('all')
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
