# @webiny/app-apw

[![](https://img.shields.io/npm/dw/@webiny/app-apw.svg)](https://www.npmjs.com/package/@webiny/app-apw)
[![](https://img.shields.io/npm/v/@webiny/app-apw.svg)](https://www.npmjs.com/package/@webiny/app-apw)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

An app for creating publishing workflows and doing content review in collaboration.

Use together with [@webiny/api-apw](../api-apw) package.

## Install

```
npm install --save @webiny/app-apw
```

Or if you prefer yarn:

```
yarn add @webiny/app-apw
```

## Setup

To setup, you must register a set of plugins. For more information on plugins, please
visit [Webiny documentation](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

#### Admin

```
import { plugins } from "@webiny/plugins";
import apwPlugins from "@webiny/app-apw/admin/plugins";

plugins.register(apwPlugins);
```
