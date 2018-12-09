# webiny-plugins

A simple registry for plugins that stores all plugins in a shared object.
The only requirement for a plugin is to have a `name` and a `type` properties. The rest is entirely up to you.

There is nothing spectacular going on under the hood, just a simple object for storing references and a few utility functions.
However, this simple library has helped us greatly while developing modular APIs and UIs in React.

## Installation
`yarn add webiny-plugins`

## Adding a plugin
```
import { addPlugin } from "webiny-plugins";

// Add a plugin
addPlugin({
    name: "my-plugin",
    type: "say-hi",
    salute: () => "Hi!"
});

addPlugin({
    name: "my-second-plugin",
    type: "say-hi",
    salute: () => "Yo!"
});
```

## Getting plugins by type
```
// anywhere in your app
import { getPlugins } from "webiny-plugins";

const plugins = getPlugins("say-hi");
plugins.forEach(plugin => {
    // Call "salute" function
    plugin.salute();
});
```

## Getting a single plugin by name
```
// anywhere in your app
import { getPlugin } from "webiny-plugins";

const plugin = getPlugin("my-plugin");
// Call "salute" function
plugin.salute();
```

## Removing a plugin
```
// anywhere in your app
import { removePlugin } from "webiny-plugins";

removePlugin("my-plugin");
```
