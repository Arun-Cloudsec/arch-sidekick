import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic',
      jsxImportSource: 'react',
    }),
  ],
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
});