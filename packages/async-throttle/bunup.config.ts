import { defineConfig } from 'bunup';

export default defineConfig({
    // Entry points
    entry: ['src/index.ts'],

    // Output both ESM and CJS
    format: ['esm', 'cjs'],

    // Output directory (relative to package root)
    outDir: 'dist',

    // Clean output directory before build
    clean: true,

    // Generate TypeScript declarations
    dts: true,

    // Target Node.js environment (can also be 'bun' or 'browser')
    target: 'node',

    // Enable source maps for debugging
    sourcemap: true,

    // Minify for production
    minify: true, // Can enable for production builds

    // External dependencies (don't bundle)
    external: [],
});
