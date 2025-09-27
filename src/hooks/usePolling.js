import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for polling data at specified intervals
 * @param {Function} fetchFunction - Function to fetch data
 * @param {number} interval - Polling interval in milliseconds (default: 3000ms)
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, startPolling, stopPolling, isPolling, refetch }
 */
export const usePolling = (fetchFunction, interval = 3000, options = {}) => {
  const {
    enabled = true,
    immediate = true,
    onError = null,
    onSuccess = null,
    dependencies = [],
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef = useRef(null);
  const isComponentMounted = useRef(true);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Fetch data function with error handling
  const fetchData = useCallback(async () => {
    if (!isComponentMounted.current) return;

    try {
      setError(null);
      const result = await fetchFunction();

      if (!isComponentMounted.current) return;

      setData(result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      if (!isComponentMounted.current) return;

      console.error("Polling error:", err);
      console.error("Error details:", err.message, err.stack);
      setError(err);
      if (onError) {
        onError(err);
      }
    } finally {
      if (isComponentMounted.current) {
        setLoading(false);
      }
    }
  }, [fetchFunction, onError, onSuccess]);

  // Start polling
  const startPolling = useCallback(() => {
    if (!isComponentMounted.current || intervalRef.current) return;

    setIsPolling(true);
    intervalRef.current = setInterval(fetchData, interval);
  }, [fetchData, interval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Manual refetch
  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  // Effect to handle initial fetch and polling setup
  useEffect(() => {
    if (!enabled || !isComponentMounted.current) return;

    // Initial fetch if immediate is true
    if (immediate) {
      fetchData();
    }

    // Start polling if enabled
    if (enabled && interval > 0) {
      // Small delay before starting polling to avoid immediate double fetch
      const timeoutId = setTimeout(
        () => {
          if (isComponentMounted.current) {
            startPolling();
          }
        },
        immediate ? interval : 0,
      );

      return () => {
        clearTimeout(timeoutId);
        stopPolling();
      };
    }

    return () => {
      stopPolling();
    };
  }, [
    enabled,
    immediate,
    interval,
    startPolling,
    stopPolling,
    fetchData,
    ...dependencies,
  ]);

  return {
    data,
    loading,
    error,
    startPolling,
    stopPolling,
    isPolling,
    refetch,
  };
};

/**
 * Hook specifically for polling poll results every 3 seconds
 * @param {string} pollId - Poll ID to fetch results for
 * @param {Object} options - Configuration options
 * @returns {Object} - Poll results data and control functions
 */
export const usePollResults = (pollId, options = {}) => {
  const fetchResults = useCallback(async () => {
    if (!pollId) return null;
    return await pollAPI.getPollResults(pollId);
  }, [pollId]);

  return usePolling(fetchResults, 3000, {
    enabled: !!pollId && options.enabled !== false,
    immediate: true,
    ...options,
    dependencies: [pollId],
  });
};

/**
 * Hook for polling poll details (less frequent)
 * @param {string} pollId - Poll ID to fetch details for
 * @param {Object} options - Configuration options
 * @returns {Object} - Poll details data and control functions
 */
export const usePollDetails = (pollId, options = {}) => {
  const fetchPoll = useCallback(async () => {
    if (!pollId) return null;
    return await pollAPI.getPoll(pollId);
  }, [pollId]);

  return usePolling(fetchPoll, options.interval || 10000, {
    enabled: !!pollId && options.enabled !== false,
    immediate: true,
    ...options,
    dependencies: [pollId],
  });
};

/**
 * Hook for polling list of polls (even less frequent)
 * @param {Object} options - Configuration options
 * @returns {Object} - Polls list data and control functions
 */
import { pollAPI } from "../services/api";

export const usePollsList = (options = {}) => {
  const fetchPolls = useCallback(async () => {
    return await pollAPI.getPolls();
  }, []);

  return usePolling(fetchPolls, options.interval || 5000, {
    enabled: options.enabled !== false,
    immediate: true,
    ...options,
  });
};

export default usePolling;
