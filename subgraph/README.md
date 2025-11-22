# 📊 DApp Store Subgraph

Subgraph de The Graph para indexar eventos del DApp Store en blockchain.

---

## 🎯 Qué es The Graph

The Graph es un protocolo de indexación descentralizado para consultar datos de blockchain. Permite crear APIs GraphQL (subgraphs) que indexan eventos de smart contracts y los hacen fácilmente consultables.

---

## 📦 Estructura del Subgraph

```
subgraph/
├── schema.graphql       # Schema GraphQL (entidades)
├── subgraph.yaml        # Configuración del subgraph
├── src/
│   └── mapping.ts       # Handlers para eventos
└── package.json         # Dependencias
```

---

## 🗂️ Entidades

### App
- Información de la aplicación
- Publisher, precio, descargas, revenue
- Versiones y compras relacionadas

### AppVersion
- Versiones de la app
- CID del manifest, fecha de publicación
- Estado (deprecated o activa)

### Publisher
- Información del publisher
- Apps publicadas, revenue total
- Estadísticas agregadas

### Purchase
- Compras de apps
- Usuario, precio, timestamp
- Relación con app y user

### User
- Usuarios del store
- Compras realizadas, gasto total

### Download
- Descargas de apps
- Usuario, timestamp

### PriceUpdate
- Historial de cambios de precio
- Precio anterior y nuevo

### GlobalStats
- Estadísticas globales del store
- Total de apps, publishers, users, etc.

---

## 🚀 Deployment

### 1. Instalar Dependencias

```bash
cd subgraph
npm install
```

### 2. Configurar subgraph.yaml

Actualizar:
- `network`: red de deployment (hardhat, sepolia, mainnet)
- `address`: dirección del contrato AppStore
- `startBlock`: bloque de deployment del contrato

```yaml
dataSources:
  - kind: ethereum
    name: AppStore
    network: sepolia  # <-- Cambiar aquí
    source:
      address: "0xYourContractAddress"  # <-- Cambiar aquí
      startBlock: 12345  # <-- Cambiar aquí
```

### 3. Generar Código

```bash
npm run codegen
```

Esto genera:
- `generated/schema.ts` - Tipos TypeScript de las entidades
- `generated/AppStore/AppStore.ts` - Tipos del contrato

### 4. Build

```bash
npm run build
```

### 5. Deploy

#### The Graph Studio (Mainnet/Testnets)

1. Crear cuenta en https://thegraph.com/studio/
2. Crear nuevo subgraph
3. Obtener deploy key
4. Autenticar:

```bash
graph auth --studio <DEPLOY_KEY>
```

5. Deploy:

```bash
graph deploy --studio dappstore
```

#### Local (Development)

1. Iniciar Graph Node local:

```bash
docker-compose up
```

2. Crear subgraph:

```bash
npm run create-local
```

3. Deploy:

```bash
npm run deploy-local
```

---

## 📝 Queries de Ejemplo

### Obtener todas las apps

```graphql
{
  apps(first: 10, orderBy: totalDownloads, orderDirection: desc) {
    id
    slug
    name
    priceEth
    totalDownloads
    publisher {
      address
    }
  }
}
```

### Buscar apps

```graphql
{
  apps(where: { name_contains_nocase: "game" }) {
    id
    slug
    name
    priceEth
  }
}
```

### Obtener app específica

```graphql
{
  app(id: "my-app") {
    id
    slug
    name
    priceEth
    totalDownloads
    totalRevenue
    versions {
      versionCode
      manifestCid
      publishedAt
    }
    purchases(first: 5) {
      buyer {
        address
      }
      price
      timestamp
    }
  }
}
```

### Apps de un publisher

```graphql
{
  publisher(id: "0x123...") {
    address
    totalApps
    totalRevenue
    apps {
      slug
      name
      priceEth
      totalDownloads
    }
  }
}
```

### Compras de un usuario

```graphql
{
  user(id: "0x456...") {
    address
    totalPurchases
    totalSpent
    purchases {
      app {
        slug
        name
      }
      price
      timestamp
    }
  }
}
```

### Estadísticas globales

```graphql
{
  globalStats(id: "global") {
    totalApps
    totalPublishers
    totalUsers
    totalPurchases
    totalDownloads
    totalRevenue
  }
}
```

---

## 🔧 Uso en Frontend

### Importar servicio

```javascript
import * as graphql from './services/graphql';
```

### Obtener apps

```javascript
const apps = await graphql.getAllApps({ first: 20 });
```

### Buscar apps

```javascript
const results = await graphql.searchApps('game');
```

### Usar hooks React

```javascript
import { useAllApps, useApp, useUserPurchases } from './hooks/useSubgraph';

function MyComponent() {
  const { apps, loading, error } = useAllApps();
  const { app } = useApp('my-app-slug');
  const { purchases } = useUserPurchases('0x123...');
  
  // ...
}
```

---

## 🧪 Testing

### Unit Tests con Matchstick

```bash
npm test
```

### Queries en GraphiQL

Después del deployment, acceder a:
- Local: http://localhost:8000/subgraphs/name/dappstore
- Studio: https://thegraph.com/studio/subgraph/dappstore

---

## 📊 Monitoreo

### Logs

```bash
docker logs graph-node
```

### Sync Status

```graphql
{
  _meta {
    block {
      number
      hash
    }
    deployment
    hasIndexingErrors
  }
}
```

---

## 🔄 Actualizar Subgraph

1. Modificar schema.graphql o mappings
2. Incrementar versión en subgraph.yaml
3. Regenerar código: `npm run codegen`
4. Build: `npm run build`
5. Deploy: `npm run deploy`

---

## ⚠️ Consideraciones

### Performance
- Usar paginación (`first`, `skip`)
- Limitar profundidad de queries
- Cachear resultados en frontend

### Costos
- Deployment en The Graph Studio es gratuito para testnets
- Mainnet requiere GRT tokens para queries

### Limitaciones
- Máximo 1000 resultados por query
- Timeout de 60 segundos
- No soporta queries complejas (joins, aggregations avanzadas)

---

## 📚 Recursos

- [The Graph Docs](https://thegraph.com/docs/)
- [AssemblyScript Book](https://www.assemblyscript.org/)
- [GraphQL Spec](https://graphql.org/)
- [Subgraph Studio](https://thegraph.com/studio/)

---

## 🐛 Troubleshooting

### Error: "Failed to deploy"
- Verificar que el contrato esté deployed
- Verificar que la red sea correcta
- Verificar que el ABI sea correcto

### Error: "Indexing errors"
- Revisar logs del Graph Node
- Verificar que los event signatures coincidan
- Verificar que los tipos sean correctos

### Queries lentas
- Agregar índices en schema
- Reducir profundidad de queries
- Usar paginación

---

**El subgraph está listo para deployment! 🚀**
