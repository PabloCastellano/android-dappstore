/**
 * Cliente GraphQL para The Graph
 * Queries para obtener datos del subgraph
 */

// URL del subgraph - actualizar según deployment
const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL || 'http://localhost:8000/subgraphs/name/dappstore';

/**
 * Ejecuta una query GraphQL
 */
async function query(queryString, variables = {}) {
  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: queryString,
        variables,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message);
    }

    return result.data;
  } catch (error) {
    console.error('GraphQL query error:', error);
    throw error;
  }
}

/**
 * Obtiene todas las apps con paginación
 */
export async function getAllApps({ first = 100, skip = 0, orderBy = 'createdAt', orderDirection = 'desc' } = {}) {
  const queryString = `
    query GetAllApps($first: Int!, $skip: Int!, $orderBy: String!, $orderDirection: String!) {
      apps(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection, where: { active: true }) {
        id
        slug
        name
        publisher {
          id
          address
        }
        latestManifestCid
        latestVersion {
          versionCode
          manifestCid
        }
        totalDownloads
        active
        createdAt
        updatedAt
      }
    }
  `;

  const data = await query(queryString, { first, skip, orderBy, orderDirection });
  return data.apps || [];
}

/**
 * Obtiene una app por slug
 */
export async function getAppBySlug(slug) {
  const queryString = `
    query GetApp($slug: String!) {
      app(id: $slug) {
        id
        slug
        name
        publisher {
          id
          address
          totalApps
        }
        latestManifestCid
        latestVersion {
          versionCode
          manifestCid
          publishedAt
        }
        totalDownloads
        active
        createdAt
        updatedAt
        versions(orderBy: versionCode, orderDirection: desc) {
          id
          versionCode
          manifestCid
          publishedAt
          deprecated
        }
        downloads(first: 10, orderBy: timestamp, orderDirection: desc) {
          id
          user {
            address
          }
          timestamp
        }
      }
    }
  `;

  const data = await query(queryString, { slug });
  return data.app;
}

/**
 * Busca apps por nombre
 */
export async function searchApps(searchTerm, { first = 20 } = {}) {
  const queryString = `
    query SearchApps($searchTerm: String!, $first: Int!) {
      apps(
        first: $first
        where: { 
          active: true
          name_contains_nocase: $searchTerm
        }
        orderBy: totalDownloads
        orderDirection: desc
      ) {
        id
        slug
        name
        latestManifestCid
        priceWei
        priceEth
        totalDownloads
        createdAt
      }
    }
  `;

  const data = await query(queryString, { searchTerm, first });
  return data.apps;
}

/**
 * Obtiene apps de un publisher
 */
export async function getPublisherApps(publisherAddress) {
  const queryString = `
    query GetPublisherApps($publisher: String!) {
      publisher(id: $publisher) {
        id
        address
        totalApps
        apps(orderBy: createdAt, orderDirection: desc) {
          id
          slug
          name
          latestManifestCid
          totalDownloads
          active
          createdAt
          versions {
            versionCode
          }
        }
      }
    }
  `;

  const data = await query(queryString, { publisher: publisherAddress.toLowerCase() });
  return data.publisher;
}

/**
 * Obtiene compras de un usuario
 */
export async function getUserPurchases(userAddress) {
  const queryString = `
    query GetUserPurchases($user: String!) {
      user(id: $user) {
        id
        address
        totalPurchases
        totalSpent
        purchases(orderBy: timestamp, orderDirection: desc) {
          id
          app {
            id
            slug
            name
            latestManifestCid
            priceEth
          }
          price
          timestamp
          transactionHash
        }
      }
    }
  `;

  const data = await query(queryString, { user: userAddress.toLowerCase() });
  return data.user;
}

/**
 * Verifica si un usuario compró una app
 */
export async function checkUserPurchase(userAddress, appSlug) {
  const queryString = `
    query CheckPurchase($user: String!, $app: String!) {
      purchases(where: { buyer: $user, app: $app }) {
        id
        timestamp
        price
      }
    }
  `;

  const data = await query(queryString, { 
    user: userAddress.toLowerCase(), 
    app: appSlug 
  });
  
  return data.purchases.length > 0 ? data.purchases[0] : null;
}

/**
 * Obtiene estadísticas globales
 */
export async function getGlobalStats() {
  const queryString = `
    query GetGlobalStats {
      globalStats(id: "global") {
        totalApps
        totalPublishers
        totalUsers
        totalPurchases
        totalDownloads
        totalRevenue
        updatedAt
      }
    }
  `;

  const data = await query(queryString);
  return data.globalStats;
}

/**
 * Obtiene apps más populares
 */
export async function getPopularApps({ first = 10 } = {}) {
  const queryString = `
    query GetPopularApps($first: Int!) {
      apps(
        first: $first
        where: { active: true }
        orderBy: totalDownloads
        orderDirection: desc
      ) {
        id
        slug
        name
        latestManifestCid
        priceWei
        priceEth
        totalDownloads
        totalRevenue
      }
    }
  `;

  const data = await query(queryString, { first });
  return data.apps;
}

/**
 * Obtiene apps recientes
 */
export async function getRecentApps({ first = 10 } = {}) {
  const queryString = `
    query GetRecentApps($first: Int!) {
      apps(
        first: $first
        where: { active: true }
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        slug
        name
        latestManifestCid
        priceWei
        priceEth
        totalDownloads
        createdAt
      }
    }
  `;

  const data = await query(queryString, { first });
  return data.apps;
}

/**
 * Obtiene apps gratuitas
 */
export async function getFreeApps({ first = 20 } = {}) {
  const queryString = `
    query GetFreeApps($first: Int!) {
      apps(
        first: $first
        where: { 
          active: true
          priceWei: "0"
        }
        orderBy: totalDownloads
        orderDirection: desc
      ) {
        id
        slug
        name
        latestManifestCid
        priceEth
        totalDownloads
      }
    }
  `;

  const data = await query(queryString, { first });
  return data.apps;
}

/**
 * Obtiene historial de precios de una app
 */
export async function getAppPriceHistory(appSlug) {
  const queryString = `
    query GetPriceHistory($app: String!) {
      priceUpdates(
        where: { app: $app }
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        oldPrice
        newPrice
        timestamp
        transactionHash
      }
    }
  `;

  const data = await query(queryString, { app: appSlug });
  return data.priceUpdates;
}

export default {
  getAllApps,
  getAppBySlug,
  searchApps,
  getPublisherApps,
  getUserPurchases,
  checkUserPurchase,
  getGlobalStats,
  getPopularApps,
  getRecentApps,
  getFreeApps,
  getAppPriceHistory,
};
