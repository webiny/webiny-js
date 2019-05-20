# webiny-app-cookie-policy
[![](https://img.shields.io/npm/dw/webiny-app-cookie-policy.svg)](https://www.npmjs.com/package/webiny-app-cookie-policy) 
[![](https://img.shields.io/npm/v/webiny-app-cookie-policy.svg)](https://www.npmjs.com/package/webiny-app-cookie-policy)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Renders a simple cookie policy info banner on your site. 
Powered by Cookie Consent (https://cookieconsent.insites.com/).

Use together with [webiny-api-cookie-policy](../webiny-api-cookie-policy) package.
  
## Install
```
npm install --save webiny-app-cookie-policy
```

Or if you prefer yarn: 
```
yarn add webiny-app-cookie-policy
```

Note: the [webiny-api-cookie-policy](../webiny-api-cookie-policy) is also required.

## Setup
To setup, you must register a set of plugins. For more information on 
plugins, please visit [Webiny documentation](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

#### Admin
```
import cookiePolicyPlugins from "webiny-app-cookie-policy/admin"
import { registerPlugins } from "webiny-plugins";

registerPlugins(cookiePolicyPlugins);
```

Enables management of cookie policy settings, which can be accessed via Settings section in the main menu. Here you
can edit things like banner position, colors and labels.


#### Site
```
import cookiePolicyPlugins from "webiny-app-cookie-policy/render"
import { registerPlugins } from "webiny-plugins";

registerPlugins(cookiePolicyPlugins);
```

Renders cookie policy banner. Use in your public website.