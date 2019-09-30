# @webiny/app-security
[![](https://img.shields.io/npm/dw/@webiny/app-security.svg)](https://www.npmjs.com/package/@webiny/app-security) 
[![](https://img.shields.io/npm/v/@webiny/app-security.svg)](https://www.npmjs.com/package/@webiny/app-security)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Enables Security module in in the Admin area. Contains the following
modules:
- Users
- Groups
- Roles

Use together with [@webiny/api-security](../api-security) package.

## Install
```
npm install --save @webiny/app-security
```

Or if you prefer yarn: 
```
yarn add @webiny/app-security
```

## Setup
To setup, you must register a set of plugins. For more information on 
plugins, please visit [Webiny documentation](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

#### Admin
```
import { registerPlugins } from "@webiny/plugins";
import securityPlugins from "@webiny/app-security/admin/plugins";

registerPlugins(securityPlugins);
```
