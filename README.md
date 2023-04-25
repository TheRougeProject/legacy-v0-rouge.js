# rouge.js

> Javascript library for interacting with the Rouge protocol V0

⚠ **DEPRECATED VERSION:** This version of the repository is no longer maintained and has been deprecated. Please refer to the updated [Rouge Protocol V2](https://github.com/TheRougeProject/v2-core). We strongly encourage you to use the latest version for improved functionality, bug fixes, and ongoing support.

## Installation

Install via [npm](https://www.npmjs.com/get-npm)

```bash
	npm i web3 rouge.js
```

or [yarn](https://github.com/yarnpkg/yarn)

```bash
	yarn add web3 rouge.js
```

`rouge.js` depends on two modules (`web3-eth` and `web3-utils`) of the
[web3.js](https://web3js.readthedocs.io/en/v1.2.4/) library.

## Bundlers help

`rouge.js` is compiled as a collection of [CommonJS](http://webpack.github.io/docs/commonjs.html) modules & [ES2015 modules](https://2ality.com/2014/09/es6-modules-final.html) for bundlers that support the `module` field in package.json (Rollup, Webpack 2).

## CDN

If you don't use a package manager, you can access `rouge.js` via
[jsDelivr](https://cdn.jsdelivr.net/npm/rouge.js/) or
[unpkg](https://unpkg.com/rouge.js/), download the source, or point
your package manager to the url.

The `rouge.js` package includes a precompiled and minified
[UMD](https://github.com/umdjs/umd) build in the
[`dist/`folder](https://cdn.jsdelivr.net/npm/rouge.js/dist/).
It can be used directly without a bundler and is thus compatible with
many popular JavaScript module loaders and environments. You can drop
a UMD build as a [`<script>`
tag](https://cdn.jsdelivr.net/npm/rouge.js) on your page. The UMD
builds make `rouge.js` available as a `window.Rouge` global variable.

Direct minified UMD url:
* jsDelivr: [https://cdn.jsdelivr.net/npm/rouge.js](https://cdn.jsdelivr.net/npm/rouge.js)
* or unpkg: [https://unpkg.com/rouge.js/dist/rouge.umd.min.js](https://unpkg.com/rouge.js/dist/rouge.umd.min.js)

## Usage

Using [web3.js](https://web3js.readthedocs.io/en/v1.2.4/), creating a
campaign can be as simple as these few lines:

```js
import Web3 from 'web3'
import { RougeProtocol } from 'rouge.js'

const web3 = new Web3(<provider>)
const myAccount = web3.eth.accounts.privateKeyToAccount(<privateKey>)

const rouge = RougeProtocol(web3)
const campaign = rouge.as(myAccount).createCampaign()
```

[Online full documentation](https://rouge.network/).

## Examples

See files in the [`examples`](examples/) folder.

### Node

```bash
npm run example-node
```

### Browser/UMD

Open the file [`examples/browser.html`](examples/browser.html) with your preferred browser.



## Contributing

We are open to contributions, see [CONTRIBUTING.md](CONTRIBUTING.md) for more info.

## Licensed under GNU AFFERO GENERAL PUBLIC LICENSE v3

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
