const uniqid = require("uniqid");

// Since the Webiny CLI can rely on "@webiny/plugins" package (chicken-egg problem), then
// we need to make a copy of its PluginsContainer class. We removed all of the extra
// features that are in reality not needed for the Webiny CLI.
const assign = (plugins, target) => {
    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        if (Array.isArray(plugin)) {
            assign(plugin, target);
            continue;
        }

        let name = plugin._name || plugin.name;
        if (!name) {
            plugin.name = name = uniqid(plugin.type + "-");
        }

        target[name] = plugin;
    }
};

module.exports = class PluginsContainer {
    plugins = {};
    constructor(...args) {
        this.register(...args);
    }

    byName(name) {
        return this.plugins[name];
    }

    byType(type) {
        const plugins = this.findByType(type);
        return Array.from(plugins);
    }

    findByType(type) {
        return Object.values(this.plugins).filter(pl => pl.type === type);
    }

    register(...args) {
        assign(args, this.plugins);
    }

    unregister(name) {
        delete this.plugins[name];
    }
};
