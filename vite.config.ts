import { defineConfig } from 'vite';

export default defineConfig({
  base: "./",
  css: {
    lightningcss: {
      targets: {
        chrome: 114 << 16,  // Version 114.0.0
        firefox: 125 << 16, // Version 125.0.0
        safari: 17 << 16    // Version 17.0.0
      }
    }
  },
  build: {
    cssMinify: false,
  }
});