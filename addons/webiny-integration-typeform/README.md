# webiny-integration-typeform

Render Typeform form in your pages.

## Installation
`yarn add webiny-integration-typeform`

## Setup
To setup, you must register a set of plugins. For more information on plugins, please visit Webiny documentation.

#### Admin

```
import typeformPlugins from "webiny-integration-typeform/plugins/admin"
import { registerPlugins } from "webiny-plugins";

registerPlugins(typeformPlugins);
```

Registers Typeform element in CMS editor, which will enable you to embed forms in your pages. 
The element will be registered under the "Form" element category.

#### Site
```
import typeformPlugins from "webiny-integration-typeform/plugins/render"
import { registerPlugins } from "webiny-plugins";

registerPlugins(typeformPlugins);
```

Enables Typeform form render in your public website.

