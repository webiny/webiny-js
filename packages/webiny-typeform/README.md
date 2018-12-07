# webiny-typeform

Renders embeded Typeform.

## Installation
 
### CMS

1. In your app, import and register admin plugins: 
```
import somePlugin from "./somePlugin";
import otherPlugin from "./otherPlugin";
import typeformPlugins from "webiny-typeform/admin/plugins";

export default [
    somePlugin,
    otherPlugin,
    ...typeformPlugins,
];
```
This will enable you to select the Typeform element in CMS editor.

## Site

Once you have finished the steps from previous section, just import render plugins from `webiny-typeform/render/plugins` 
in your site app.

```
import somePlugin from "./somePlugin";
import otherPlugin from "./otherPlugin";
import typeformPlugins from "webiny-typeform/render/plugins";

export default [
    somePlugin,
    otherPlugin,
    ...typeformPlugins,
];
```


