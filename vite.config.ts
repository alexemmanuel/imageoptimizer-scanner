import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // ---- ADDED THE DEPLOYMENT PATH PATH BELOW THIS LINE ----
    // This tells GitHub Pages exactly which subfolder to serve your site from
    base: '/imageoptimizer-scanner/', 
    
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    // ---- BUILD CONFIGURATION ----
    build: {
      rolldownOptions: {
        output: {
          // Enforces that execution order remains identical to your source code
          strictExecutionOrder: true, 
          
          // Safely groups external libraries and breaks them into smaller pieces
          codeSplitting: {
            minSize: 50000,   // 50 kB minimum chunk size
            maxSize: 450000,  // 450 kB maximum target chunk size
            groups: [
              {
                name: 'google-ai-vendor',
                test: /node_modules[\\/]@google[\\/]genai/,
                priority: 30
              },
              {
                name: 'core-vendor',
                test: /node_modules[\\/](react|react-dom)/,
                priority: 20
              },
              {
                name: 'third-party-libs',
                test: /[\\/]node_modules[\\/]/,
                priority: 10
              }
            ]
          }
        }
      }
    }
  };
});
