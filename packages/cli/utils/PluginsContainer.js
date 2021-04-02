const uniqid = require("uniqid");

const isOptionsObject = item => item && !Array.isArray(item) && !item.type && !item.name;
const normalizeArgs = args => {
    let options = {};

    // Check if last item in the plugins array is actually an options object.
    if (isOptionsObject(args[args.length - 1])) {
        [options] = args.splice(-1, 1);
    }

    return [args, options];
};

const assign = (plugins, options, target) => {
    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        if (Array.isArray(plugin)) {
            assign(plugin, options, target);
            continue;
        }

        let name = plugin._name || plugin.name;
        if (!name) {
            plugin.name = name = uniqid(plugin.type + "-");
        }

        // If skip existing was set to true, and a plugin with the same name was already registered, skip registration.
        if (!options.skipExisting || !target[name]) {
            target[name] = plugin;
            plugin.init && plugin.init();
        }
    }
};

module.exports = class PluginsContainer {
    plugins = {};
    _byTypeCache = {};

    constructor(...args) {
        this.register(...args);
    }

    byName(name) {
        return this.plugins[name];
    }

    byType(type) {
        if (this._byTypeCache[type]) {
            return Array.from(this._byTypeCache[type]);
        }
        const plugins = this.findByType(type);
        this._byTypeCache[type] = plugins;
        return Array.from(plugins);
    }

    atLeastOneByType(type) {
        const list = this.byType(type);
        if (list.length === 0) {
            throw new Error(`There are no plugins by type "${type}".`);
        }
        return list;
    }

    oneByType(type) {
        const list = this.atLeastOneByType(type);
        if (list.length > 1) {
            throw new Error(
                `There is a requirement for plugin of type "${type}" to be only one registered.`
            );
        }
        return list[0];
    }

    all() {
        return Object.values(this.plugins);
    }

    register(...args) {
        // reset the cache when adding new plugins
        this._byTypeCache = {};
        const [plugins, options] = normalizeArgs(args);
        assign(plugins, options, this.plugins);
    }

    unregister(name) {
        // reset the cache when removing a plugin
        this._byTypeCache = {};
        delete this.plugins[name];
    }

    findByType(type) {
        return Object.values(this.plugins).filter(pl => pl.type === type);
    }
};
