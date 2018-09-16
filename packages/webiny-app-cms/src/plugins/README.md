# Plugins

Page editor supports different types of plugins, each with a very specific purpose.
As a developer you can introduce new types of plugins so we decided to identify plugins by `name` and `type`.

A `name` is a unique string that identifies a plugin.
A `type` is a string that identifies plugins of similar purpose (group of plugins).

## Working with plugins
To add and access plugins there are a few helper methods at your disposal:

```js
import { addPlugin, getPlugins, getPlugin } from "webiny-app/plugins";

// Minimal plugin structure
const MyPlugin = {
    name: "my-plugin",
    type: "custom-type"
};

// Add a single plugin
addPlugin(MyPlugin);

// Add multiple plugins at once
addPlugin(MyPlugin1, MyPlugin2, AnotherPlugin);

// Get all plugins of certain type
const plugins = getPlugins("custom-type");

// Get a single plugin
const myPlugin = getPlugin("my-plugin");
```

## Plugin structure
This depends heavily on what your plugins do. The only requirement is to provide a `type` and a `name`.
Other than that, you are free to define whatever properties you need.