# @webiny/app-i18n-content
[![](https://img.shields.io/npm/dw/@webiny/app-i18n-content.svg)](https://www.npmjs.com/package/@webiny/app-i18n-content) 
[![](https://img.shields.io/npm/v/@webiny/app-i18n-content.svg)](https://www.npmjs.com/package/@webiny/app-i18n-content)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Enables Security module in the Admin area. Contains the following
modules:
- Users
- Groups
- Roles

Use together with [@webiny/api-security](../api-security) package.

## Install
```
npm install --save @webiny/app-i18n-content
```

Or if you prefer yarn: 
```
yarn add @webiny/app-i18n-content
```

## Setup
To setup, you must register a set of plugins. For more information on 
plugins, please visit [Webiny documentation](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

#### Admin
```
import { plugins } from "@webiny/plugins";
import securityPlugins from "@webiny/app-i18n-content/admin/plugins";

plugins.register(securityPlugins);
```
