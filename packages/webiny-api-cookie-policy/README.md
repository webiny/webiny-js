# webiny-api-cookie-policy
[![](https://img.shields.io/npm/dw/webiny-api-cookie-policy.svg)](https://www.npmjs.com/package/webiny-api-cookie-policy) 
[![](https://img.shields.io/npm/v/webiny-api-cookie-policy.svg)](https://www.npmjs.com/package/webiny-api-cookie-policy)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

The API for the Webiny Cookie Policy ([webiny-app-cookie-policy](../webiny-app-cookie-policy)) app.
    
## Install
```
npm install --save webiny-app-cookie-policy
```

Or if you prefer yarn: 
```
yarn add webiny-app-cookie-policy
```

## Setup
To setup, you must register a set of plugins. For more information on 
plugins, please visit [Webiny documentation](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

```
import cookiePolicyPlugins from "webiny-api-cookie-policy"
import { registerPlugins } from "webiny-plugins";

registerPlugins(cookiePolicyPlugins);
```

Exposes necessary GraphQL fields for updating app settings.