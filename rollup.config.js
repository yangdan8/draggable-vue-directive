import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  output: {
    name: 'DraggableVueDirective',
    dir: 'dist',
    format: 'umd',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    json(),
    typescript(),
    babel({
      exclude: 'node_modules/**',
      plugins: ['external-helpers'],
    }),
    terser(),
  ],
  external: ['vue'],
};
