module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,  // ✅ 3 corridas por URL para estabilidad
      url: [
        'http://localhost:3000',  // roulette
        'http://localhost:3001',  // memotest
      ],
      // ✅ Configuración de Chrome para Windows
      chromePath: undefined,
      chromeFlags: [
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
      ],
      settings: {
        maxWaitForFcp: 60000,  // 60s timeout (doble del default)
        maxWaitForLoad: 90000,  // 90s para carga completa
      },
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        // Core Web Vitals prioritarios
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Otras métricas clave
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
        'interactive': ['warn', { maxNumericValue: 3800 }],

        // Performance score general
        'categories:performance': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'filesystem',  // ✅ Artefactos reproducibles para CI
      outputDir: '.lighthouseci',
    },
  },
};
