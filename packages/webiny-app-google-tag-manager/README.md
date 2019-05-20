# webiny-app-google-tag-manager
[![](https://img.shields.io/npm/dw/webiny-app-google-tag-manager.svg)](https://www.npmjs.com/package/webiny-app-google-tag-manager) 
[![](https://img.shields.io/npm/v/webiny-app-google-tag-manager.svg)](https://www.npmjs.com/package/webiny-app-google-tag-manager)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Initializes Google Tag Manager (https://marketingplatform.google.com/about/tag-manager/) 
on your site.

Use together with [webiny-api-google-tag-manager](../webiny-api-google-tag-manager) 
package.
  
## Install
```
npm install --save webiny-app-google-tag-manager
```

Or if you prefer yarn: 
```
yarn add webiny-app-google-tag-manager
```

Note: the [webiny-api-google-tag-manager](../webiny-api-google-tag-manager) is also required.

## Setup
To setup, you must register a set of plugins. For more information on 
plugins, please visit [Webiny documentation](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

#### Admin
```
import gtmPlugins from "webiny-app-google-tag-manager/admin"
import { registerPlugins } from "webiny-plugins";

registerPlugins(gtmPlugins);
```

Enables management of GTM settings, which can be accessed via Settings 
section in the main menu. You will paste your GTM "Container ID" here 
(this is required in order for the integration to work properly).
    
#### Site
```
import gtmPlugins from "webiny-app-google-tag-manager/render"
import { registerPlugins } from "webiny-plugins";

registerPlugins(gtmPlugins);
```

Initializes Google Tag Manager on your site.