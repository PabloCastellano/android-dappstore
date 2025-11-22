/**
 * Hook React para interactuar con el subgraph de The Graph
 */

import { useState, useEffect, useCallback } from 'react';
import * as graphql from '../services/graphql';

/**
 * Hook para obtener todas las apps
 */
export function useAllApps(options = {}) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await graphql.getAllApps(options);
      setApps(data);
    } catch (err) {
      console.error('Error loading apps:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  return { apps, loading, error, refetch: loadApps };
}

/**
 * Hook para obtener una app específica
 */
export function useApp(slug) {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadApp = useCallback(async () => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await graphql.getAppBySlug(slug);
      setApp(data);
    } catch (err) {
      console.error('Error loading app:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadApp();
  }, [loadApp]);

  return { app, loading, error, refetch: loadApp };
}

/**
 * Hook para buscar apps
 */
export function useSearchApps(searchTerm, options = {}) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async () => {
    if (!searchTerm || searchTerm.length < 2) {
      setApps([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await graphql.searchApps(searchTerm, options);
      setApps(data);
    } catch (err) {
      console.error('Error searching apps:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, JSON.stringify(options)]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search();
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [search]);

  return { apps, loading, error };
}

/**
 * Hook para obtener apps de un publisher
 */
export function usePublisherApps(publisherAddress) {
  const [publisher, setPublisher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPublisher = useCallback(async () => {
    if (!publisherAddress) return;

    setLoading(true);
    setError(null);
    try {
      const data = await graphql.getPublisherApps(publisherAddress);
      setPublisher(data);
    } catch (err) {
      console.error('Error loading publisher apps:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [publisherAddress]);

  useEffect(() => {
    loadPublisher();
  }, [loadPublisher]);

  return { publisher, apps: publisher?.apps || [], loading, error, refetch: loadPublisher };
}

/**
 * Hook para obtener compras de un usuario
 */
export function useUserPurchases(userAddress) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPurchases = useCallback(async () => {
    if (!userAddress) return;

    setLoading(true);
    setError(null);
    try {
      const data = await graphql.getUserPurchases(userAddress);
      setUser(data);
    } catch (err) {
      console.error('Error loading purchases:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  return { user, purchases: user?.purchases || [], loading, error, refetch: loadPurchases };
}

/**
 * Hook para verificar si un usuario compró una app
 */
export function useCheckPurchase(userAddress, appSlug) {
  const [purchased, setPurchased] = useState(false);
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkPurchase = useCallback(async () => {
    if (!userAddress || !appSlug) return;

    setLoading(true);
    setError(null);
    try {
      const data = await graphql.checkUserPurchase(userAddress, appSlug);
      setPurchased(!!data);
      setPurchase(data);
    } catch (err) {
      console.error('Error checking purchase:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userAddress, appSlug]);

  useEffect(() => {
    checkPurchase();
  }, [checkPurchase]);

  return { purchased, purchase, loading, error, refetch: checkPurchase };
}

/**
 * Hook para obtener estadísticas globales
 */
export function useGlobalStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await graphql.getGlobalStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, error, refetch: loadStats };
}

/**
 * Hook para obtener apps populares
 */
export function usePopularApps(options = {}) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await graphql.getPopularApps(options);
      setApps(data);
    } catch (err) {
      console.error('Error loading popular apps:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  return { apps, loading, error, refetch: loadApps };
}

/**
 * Hook para obtener apps recientes
 */
export function useRecentApps(options = {}) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await graphql.getRecentApps(options);
      setApps(data);
    } catch (err) {
      console.error('Error loading recent apps:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  return { apps, loading, error, refetch: loadApps };
}
