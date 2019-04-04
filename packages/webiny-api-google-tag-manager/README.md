# webiny-integration-google-tag-manager

Initializes Google Tag Manager (https://marketingplatform.google.com/about/tag-manager/).

## Installation
`yarn add webiny-integration-google-tag-manager`

## Setup
To setup, you must register a set of plugins. For more information on plugins, please visit Webiny documentation.

#### API
```
import gtmPlugins from "webiny-api-google-tag-manager"
import { registerPlugins } from "webiny-plugins";

registerPlugins(gtmPlugins);
```

Exposes necessary GraphQL fields for updating integration settings.


#### Admin
```
import gtmPlugins from "webiny-app-google-tag-manager/admin"
import { registerPlugins } from "webiny-plugins";

registerPlugins(gtmPlugins);
```

Enables management of GTM settings, which can be accessed via Settings section in the main menu. You will paste
your GTM "Container ID" here (this is required in order for the integration to work properly).


#### Site
```
import gtmPlugins from "webiny-app-google-tag-manager/render"
import { registerPlugins } from "webiny-plugins";

registerPlugins(gtmPlugins);
```

Initializes Google Tag Manager. Use in your public website.