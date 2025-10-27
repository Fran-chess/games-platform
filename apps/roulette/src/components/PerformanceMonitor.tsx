'use client';

import { useEffect } from 'react';
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals/attribution';

/**
 * Performance monitoring component that captures Core Web Vitals
 * Uses web-vitals library with attribution for detailed debugging
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint): < 2.5s
 * - INP (Interaction to Next Paint): < 200ms
 * - CLS (Cumulative Layout Shift): < 0.1
 * - FCP (First Contentful Paint): < 1.8s
 * - TTFB (Time to First Byte): < 800ms
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in development or when explicitly enabled
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_PERF_MONITORING === 'true') {
      // CLS - Cumulative Layout Shift
      onCLS((metric) => {
        console.log('🎯 CLS:', {
          value: metric.value,
          rating: metric.rating,
          attribution: metric.attribution,
        });
      });

      // INP - Interaction to Next Paint (replaces FID)
      onINP((metric) => {
        console.log('⚡ INP:', {
          value: metric.value,
          rating: metric.rating,
          attribution: metric.attribution,
        });
      });

      // LCP - Largest Contentful Paint
      onLCP((metric) => {
        console.log('🖼️  LCP:', {
          value: metric.value,
          rating: metric.rating,
          attribution: metric.attribution,
        });
      });

      // FCP - First Contentful Paint
      onFCP((metric) => {
        console.log('🎨 FCP:', {
          value: metric.value,
          rating: metric.rating,
        });
      });

      // TTFB - Time to First Byte
      onTTFB((metric) => {
        console.log('🚀 TTFB:', {
          value: metric.value,
          rating: metric.rating,
        });
      });
    }
  }, []);

  return null;
}
