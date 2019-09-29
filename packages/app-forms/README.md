# @webiny/app-forms
[![](https://img.shields.io/npm/dw/@webiny/app-forms.svg)](https://www.npmjs.com/package/@webiny/app-forms) 
[![](https://img.shields.io/npm/v/@webiny/app-forms.svg)](https://www.npmjs.com/package/@webiny/app-forms)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

An app for creating forms that can be embedded into pages created 
with [Webiny Page Builder](../api-page-builder). 

Use together with [@webiny/api-forms](../api-forms) package.

## Install
```
npm install --save @webiny/app-forms
```

Or if you prefer yarn: 
```
yarn add @webiny/app-forms
```

## Setup
To setup, you must register a set of plugins. For more information on 
plugins, please visit [Webiny documentation](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

#### Admin
```
import { registerPlugins } from "@webiny/plugins";
import formsPlugins from "@webiny/app-forms/admin/plugins";
import formsCmsPlugins from "@webiny/app-forms/page-builder/admin/plugins";

registerPlugins(formsPlugins);
```

Note: the `formsCmsPlugins` contains plugins for the Page Builder, which will
enable you to embed forms in your pages.
    
#### Site
```
import { registerPlugins } from "@webiny/plugins";
import formsSitePlugins from "@webiny/app-forms/site/plugins";
import formsCmsPlugins from "@webiny/app-forms/page-builder/site/plugins";

registerPlugins(formsPlugins);
```
