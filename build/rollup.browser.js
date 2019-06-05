import alias from 'rollup-plugin-alias'
import { terser } from 'rollup-plugin-terser'

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/browser.min.js',
    format: 'iife',
    name: 'tapsig'
  },
  plugins: [
    alias({
      '@debugger': './log.browser.js'
    }),
    terser()
  ]
}
