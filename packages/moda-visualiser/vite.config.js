// vite.config.js
const path = require('path')
const { defineConfig } = require('vite')
import glsl from 'vite-plugin-glsl';

module.exports = defineConfig({
  plugins: [
    glsl(), // Import and use GLSL files
  ],
  build: {
    minify: true,
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      name: 'ModaVisualiser',
      fileName: (format) => `moda-visualiser.${format}.js`
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['three'],
    }
  }
})