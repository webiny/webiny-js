# @webiny/app-form-builder
[![](https://img.shields.io/npm/dw/@webiny/app-form-builder.svg)](https://www.npmjs.com/package/@webiny/app-form-builder) 
[![](https://img.shields.io/npm/v/@webiny/app-form-builder.svg)](https://www.npmjs.com/package/@webiny/app-form-builder)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

An app for creating forms that can be embedded into pages created 
with [Webiny Page Builder](../api-page-builder). 

Use together with [@webiny/api-form-builder](../api-form-builder) package.

## Install
```
npm install --save @webiny/app-form-builder
```

Or if you prefer yarn: 
```
yarn add @webiny/app-form-builder
```

## Setup
To setup, you must register a set of plugins. For more information on 
plugins, please visit [Webiny documentation](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

#### Admin
```
import { registerPlugins } from "@webiny/plugins";
import formsPlugins from "@webiny/app-form-builder/admin/plugins";
import formsCmsPlugins from "@webiny/app-form-builder/page-builder/admin/plugins";

registerPlugins(formsPlugins);
```

Note: the `formsCmsPlugins` contains plugins for the Page Builder, which will
enable you to embed forms in your pages.
    
#### Site
```
import { registerPlugins } from "@webiny/plugins";
import formsSitePlugins from "@webiny/app-form-builder/site/plugins";
import formsCmsPlugins from "@webiny/app-form-builder/page-builder/site/plugins";

registerPlugins(formsPlugins);
```
