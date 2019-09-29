# @webiny/app-typeform
[![](https://img.shields.io/npm/dw/@webiny/app-typeform.svg)](https://www.npmjs.com/package/@webiny/app-typeform) 
[![](https://img.shields.io/npm/v/@webiny/app-typeform.svg)](https://www.npmjs.com/package/@webiny/app-typeform)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Adds TypeForm CMS element that enables you to embed 
[TypeForm](https://www.typeform.com/) forms in your pages. 
  
## Install
```
npm install --save @webiny/app-typeform
```

Or if you prefer yarn: 
```
yarn add @webiny/app-typeform
```

## Setup
To setup, you must register a set of [plugins](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

#### Admin

```
import { registerPlugins } from "@webiny/plugins";
import typeformPlugins from "@webiny/app-typeform/admin";

registerPlugins(typeformPlugins);
```

Registers Typeform element in CMS editor, which will enable you to embed forms in your pages. 
The element will be registered under the "Form" element category.

#### Site
```
import { registerPlugins } from "@webiny/plugins";
import typeformPlugins from "@webiny/app-typeform/render";

registerPlugins(typeformPlugins);
```

Enables Typeform form render in your public website.

