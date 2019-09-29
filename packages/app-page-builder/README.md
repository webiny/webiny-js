# @webiny/app-page-builder
[![](https://img.shields.io/npm/dw/@webiny/app-page-builder.svg)](https://www.npmjs.com/package/@webiny/app-page-builder) 
[![](https://img.shields.io/npm/v/@webiny/app-page-builder.svg)](https://www.npmjs.com/package/@webiny/app-page-builder)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Enables Webiny Page Builder in the Admin area and on your site. 

Use together with [@webiny/api-page-builder](../api-page-builder) package.

## Install
```
npm install --save @webiny/app-page-builder
```

Or if you prefer yarn: 
```
yarn add @webiny/app-page-builder
```

## Setup
To setup, you must register a set of plugins. For more information on 
plugins, please visit [Webiny documentation](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

#### Admin
```
import { registerPlugins } from "@webiny/plugins";
import pageBuilderPlugins from "@webiny/app-page-builder/admin/plugins";

registerPlugins(pageBuilderPlugins);
```
    
#### Site
```
import { registerPlugins } from "@webiny/plugins";
import pageBuilderPlugins from "@webiny/app-page-builder/site/plugins";

registerPlugins(pageBuilderPlugins);
```
