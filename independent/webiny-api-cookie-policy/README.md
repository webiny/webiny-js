# webiny-integration-cookie-policy

Renders a simple cookie policy info banner. Powered by Cookie Consent (https://cookieconsent.insites.com/).

## Installation
`yarn add webiny-integration-cookie policy`

## Setup
To setup, you must register a set of plugins. For more information on plugins, please visit Webiny documentation.

#### API
```
import cookiePolicyPlugins from "webiny-api-cookie-policy"
import { registerPlugins } from "webiny-plugins";

registerPlugins(cookiePolicyPlugins);
```

Exposes necessary GraphQL fields for updating integration settings.


#### Admin
```
import cookiePolicyPlugins from "webiny-app-cookie-policy/admin"
import { registerPlugins } from "webiny-plugins";

registerPlugins(cookiePolicyPlugins);
```

Enables management of cookie policy settings, which can be accessed via Settings section in the main menu. Here you
can edit things like banner position, colors and labels.


#### Site
```
import cookiePolicyPlugins from "webiny-app-cookie-policy/render"
import { registerPlugins } from "webiny-plugins";

registerPlugins(cookiePolicyPlugins);
```

Renders cookie policy banner. Use in your public website.