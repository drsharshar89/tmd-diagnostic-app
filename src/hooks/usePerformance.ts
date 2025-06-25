import { useState, useEffect, useCallback } from 'react';

export const usePerformance = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0,
  });

  const trackPerformance = useCallback((metricName: string, value: number) => {
    setMetrics((prev) => ({
      ...prev,
      [metricName]: value,
    }));
  }, []);

  const measureTime = useCallback((): number => {
    return performance.now();
  }, []);

  useEffect(() => {
    // Track initial load time
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      trackPerformance('loadTime', loadTime);
    }
  }, [trackPerformance]);

  return {
    metrics,
    trackPerformance,
    measureTime,
  };
};