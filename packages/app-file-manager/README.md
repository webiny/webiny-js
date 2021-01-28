# @webiny/file-manager
[![](https://img.shields.io/npm/dw/@webiny/app-file-manager.svg)](https://www.npmjs.com/package/@webiny/app-file-manager) 
[![](https://img.shields.io/npm/v/@webiny/app-file-manager.svg)](https://www.npmjs.com/package/@webiny/app-file-manager)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

UI Components for File Manager configurations
  
## Install
```
npm install --save @webiny/app-file-manager
```

Or if you prefer yarn: 
```
yarn add @webiny/app-file-manager
```

## Setup
To setup, you must register a set of plugins. For more information on 
plugins, please visit [Webiny documentation](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

#### Admin
```
import { plugins } from "@webiny/plugins";
import appFileManagerPlugin from "@webiny/app-file-manager/admin"

plugins.register(appFileManagerPlugin);
```

Enables the file manager settings components which can be accessed via Settings 
section in the main menu.
