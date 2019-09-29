# @webiny/plugins
[![](https://img.shields.io/npm/dw/@webiny/plugins.svg)](https://www.npmjs.com/package/@webiny/plugins) 
[![](https://img.shields.io/npm/v/@webiny/plugins.svg)](https://www.npmjs.com/package/@webiny/plugins)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A simple registry that stores all plugins in a shared object.
The only requirement for a plugin is to have a `name` and a `type` properties. 
The rest is entirely up to you.

There is nothing spectacular going on under the hood, just a simple 
object for storing references and a few utility functions.

For more information, please visit [the official docs](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).
  
## Install
```
npm install --save @webiny/plugins
```

Or if you prefer yarn: 
```
yarn add @webiny/plugins
```

## Usage

### Adding a plugin
```
import { registerPlugins } from "@webiny/plugins";

// Add a plugin
registerPlugins({
    name: "my-plugin",
    type: "say-hi",
    salute: () => "Hi!"
});

registerPlugins({
    name: "my-second-plugin",
    type: "say-hi",
    salute: () => "Yo!"
});
```

### Getting plugins by type
```
// anywhere in your app
import { getPlugins } from "@webiny/plugins";

const plugins = getPlugins("say-hi");
plugins.forEach(plugin => {
    // Call "salute" function
    plugin.salute();
});
```

### Getting a single plugin by name
```
// anywhere in your app
import { getPlugin } from "@webiny/plugins";

const plugin = getPlugin("my-plugin");
// Call "salute" function
plugin.salute();
```

### Removing a plugin
```
// anywhere in your app
import { unregisterPlugin } from "@webiny/plugins";

unregisterPlugin("my-plugin");
```
