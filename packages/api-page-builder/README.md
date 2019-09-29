# @webiny/api-cms
[![](https://img.shields.io/npm/dw/@webiny/api-cms.svg)](https://www.npmjs.com/package/@webiny/api-cms) 
[![](https://img.shields.io/npm/v/@webiny/api-cms.svg)](https://www.npmjs.com/package/@webiny/api-cms)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

The API for the Webiny CMS ([@webiny/app-page-builder](../app-page-builder)) app.
    
## Install
```
npm install --save @webiny/api-cms
```

Or if you prefer yarn: 
```
yarn add @webiny/api-cms
```

## Setup
To setup, you must register a set of plugins. For more information on 
plugins, please visit [Webiny documentation](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

```
import cmsPlugins from "@webiny/api-cms"
import { registerPlugins } from "@webiny/plugins";

registerPlugins(...cmsPlugins);
```

Exposes necessary GraphQL fields that handle app settings, pages and more.
