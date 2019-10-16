import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import commonjs from 'rollup-plugin-commonjs';

export default {
	input: ['js/index.js'],
	output: {
		file: 'public/index.js',
		format: 'iife',
		sourcemap: true
	},
	plugins: [
		resolve(),
		commonjs({
            namedExports: {
                'node_modules/bootstrap/dist/js/bootstrap.min.js' : ['bootstrap'],
                'node_modules/d3/dist/d3.min.js' : ['d3']
            }
		}),
		// minify
		terser()
	]
};