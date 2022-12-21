# @webiny/app-page-builder-theme
[![](https://img.shields.io/npm/dw/@webiny/app-page-builder-theme.svg)](https://www.npmjs.com/package/@webiny/app-page-builder-theme) 
[![](https://img.shields.io/npm/v/@webiny/app-page-builder-theme.svg)](https://www.npmjs.com/package/@webiny/app-page-builder-theme)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Enables Webiny Page Builder in the Admin area and on your site. 

Use together with [@webiny/api-page-builder-theme](../api-page-builder-theme) package.

## Install
```
npm install --save @webiny/app-page-builder-theme
```

Or if you prefer yarn: 
```
yarn add @webiny/app-page-builder-theme
```

## Setup
To setup, you must register a set of plugins. For more information on 
plugins, please visit [Webiny documentation](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

#### Admin
```
import { plugins } from "@webiny/plugins";
import pageBuilderPlugins from "@webiny/app-page-builder-theme/admin/plugins";

plugins.register(pageBuilderPlugins);
```

Note that, once deployed, when you open your Admin interface for the first time, you will be prompted with a short installation wizard.
     
#### Site
```
import { plugins } from "@webiny/plugins";
import pageBuilderPlugins from "@webiny/app-page-builder-theme/site/plugins";

plugins.register(pageBuilderPlugins);
```

