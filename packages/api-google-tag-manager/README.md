# webiny-api-google-tag-manager
[![](https://img.shields.io/npm/dw/webiny-api-google-tag-manager.svg)](https://www.npmjs.com/package/webiny-api-google-tag-manager) 
[![](https://img.shields.io/npm/v/webiny-api-google-tag-manager.svg)](https://www.npmjs.com/package/webiny-api-google-tag-manager)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

The API for the Webiny Google Tag Manager ([webiny-app-google-tag-manager](../webiny-app-google-tag-manager)) app.
    
## Install
```
npm install --save webiny-api-google-tag-manager
```

Or if you prefer yarn: 
```
yarn add webiny-api-google-tag-manager
```

## Setup
To setup, you must register a set of plugins. For more information on 
plugins, please visit [Webiny documentation](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

```
import gtmPlugins from "@webiny/api-google-tag-manager"
import { registerPlugins } from "@webiny/plugins";

registerPlugins(gtmPlugins);
```

Exposes necessary GraphQL fields for updating app settings.