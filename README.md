# rouge.js

![Node](https://img.shields.io/node/v/rouge.js.svg?style=flat-square)
[![NPM](https://img.shields.io/npm/v/rouge.js.svg?style=flat-square)](https://www.npmjs.com/package/rouge.js)
[![David](https://img.shields.io/david/TheRougeProject/rouge.js.svg?style=flat-square)](https://david-dm.org/TheRougeProject/rouge.js)

<!--
[![NPM](https://img.shields.io/npm/dt/rouge.js.svg?style=flat-square)](https://www.npmjs.com/package/rouge)

[![Travis](https://img.shields.io/travis/TheRougeProject/rouge.js/master.svg?style=flat-square)](https://travis-ci.org/TheRougeProject/rouge.js)

[![Coverage Status](https://img.shields.io/coveralls/TheRougeProject/rouge.js.svg?style=flat-square)](https://coveralls.io/github/TheRougeProject/rouge.js)
-->

> Javascript library for interacting with the Rouge protocol

The Rouge protocol is an open-source blockchain voucher and note
protocol built as a suite of smart contracts using a specific token —
the Rouge token — on Ethereum compatible blockchains (tested on
Ethereum and POA).

Rouge is for all types of usage of non-repudiable and unique usage
digital vouchers (for example, e-tickets, e-coupons, cashback notes,
etc).

Using the javascript rouge.js package you can easily add
non-repudiable and unique usage digital vouchers without learning
Solidity in the browser (ÐApps), a nodejs backend app or even a
nativescript mobile app.

### Installation

Install via [yarn](https://github.com/yarnpkg/yarn)

	yarn add rouge

or npm

	npm i rouge

### Usage

```js
import { RougeProtocol } from 'rouge.js'

```

[Online documentation](https://rouge.network/).


<!--
### Examples

See [`example`](example/script.js) folder or the [runkit](https://runkit.com/TheRougeProject/rouge.js) example.

### Builds

If you don't use a package manager, you can [access `rouge` via unpkg (CDN)](https://unpkg.com/rouge/), download the source, or point your package manager to the url.

`rouge` is compiled as a collection of [CommonJS](http://webpack.github.io/docs/commonjs.html) modules & [ES2015 modules](http://www.2ality.com/2014/0
  -9/es6-modules-final.html) for bundlers that support the `jsnext:main` or `module` field in package.json (Rollup, Webpack 2)

The `rouge` package includes precompiled production and development [UMD](https://github.com/umdjs/umd) builds in the [`dist/umd` folder](https://unpkg.com/rouge/dist/umd/). They can be used directly without a bundler and are thus compatible with many popular JavaScript module loaders and environments. You can drop a UMD build as a [`<script>` tag](https://unpkg.com/rouge) on your page. The UMD builds make `rouge` available as a `window.rouge` global variable.
-->

### Contributing

We are open to contributions, see [CONTRIBUTING.md](CONTRIBUTING.md) for more info.

### Licensed under GNU AFFERO GENERAL PUBLIC LICENSE v3

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
