import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';
import json from 'rollup-plugin-json';
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';

export default [
	// browser-friendly UMD build
	{
		input: 'src/index.js',
		output: {
		  name: 'Rouge',
		  file: 'dist/rouge.umd.min.js',
		  format: 'umd'
		},
		plugins: [
          json(),
          replace({ __version__: process.env.VERSION }),
		  resolve(),
		  commonjs(),
          terser()
		]
	},

	// CommonJS (for Node) and ES module (for bundlers) build.
	{
		input: 'src/index.js',
		external: ['ms'],
		plugins: [
          json(),
          replace({ __version__: process.env.VERSION }),
		],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		]
	}
];
