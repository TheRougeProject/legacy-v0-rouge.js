import babel from 'rollup-plugin-babel'
import nodeResolve from 'rollup-plugin-node-resolve'
// import uglify from 'rollup-plugin-uglify'
// import bundleSize from 'rollup-plugin-bundle-size'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'

const name = `rouge`

const plugins = [
  babel({ exclude: [ 'contracts/**' ] }),
  json({ exclude: [ 'node_modules/**' ] }),
  nodeResolve({
    module: true,
    jsnext: true
  }),
  commonjs({
    include: `node_modules/**`
  }) // ,
  // bundleSize() TODO fix 'Path must be a string. Received undefined' bug
]

const isProd = process.env.NODE_ENV === `production`
// if (isProd) plugins.push(uglify()); TODO fix problem with json

export default {
  entry: `src/index.js`,
  plugins,
  dest: `dist/umd/${name}${isProd ? `.min` : ``}.js`,
  moduleName: name,
  format: `umd`
}
