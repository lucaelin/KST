import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import { terser } from 'rollup-plugin-terser';

const resources = [];

export default [{
  input: './main.js',
  output: [
    {
      format: 'iife',
      file: './browser.js',
    }
  ],

  plugins: [
    resolve({browser: true}),
    commonjs(),
    minifyHTML(),
    terser(),
    copy({
      targets: [...resources]
    }),
  ],

  watch: {
    clearScreen: false,
  },
}];
