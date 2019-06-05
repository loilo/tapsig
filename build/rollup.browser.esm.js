import alias from 'rollup-plugin-alias'
import { terser } from 'rollup-plugin-terser'

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/browser.esm.min.js',
    format: 'es'
  },
  plugins: [
    alias({
      '@debugger': './log.browser.js'
    }),
    terser()
  ]
}
