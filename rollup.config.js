import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
const packages = require('./package.json');

export default [
    // .umd.js
  {
    input: 'src/index.ts',
    output: [
      {
        name: 'DraggableVueDirective',
        file: `dist/${packages.name}.umd.js`,
        format: 'umd',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      json(),
      typescript({
        rootDir: 'src/',
      }),
      babel({
        exclude: 'node_modules/**',
        plugins: ['external-helpers'],
      }),
    ],
    external: ['vue'],
  },
  // .umd.min.js
  {
    input: 'src/index.ts',
    output: [
      {
        name: 'DraggableVueDirective',
        file: `dist/${packages.name}.umd.min.js`,
        format: 'umd',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      json(),
      typescript({
        rootDir: 'src/',
      }),
      babel({
        exclude: 'node_modules/**',
        plugins: ['external-helpers'],
      }),
      terser(),
    ],
    external: ['vue'],
  },
  // .js, d.ts
  {
    input: 'src/index.ts',
    output: [
      {
        name: 'DraggableVueDirective',
        dir: 'dist',
        format: 'umd',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      json(),
      typescript({
        rootDir: 'src/',
        declaration: true,
        declarationDir: 'dist/',
      }),
      babel({
        exclude: 'node_modules/**',
        plugins: ['external-helpers'],
      }),
    ],
    external: ['vue'],
  },
];
