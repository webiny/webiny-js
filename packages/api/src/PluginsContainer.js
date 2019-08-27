// @flow
import type { PluginType } from "./types";

const assign = (plugins, target) => {
    for (let i = 0; i < plugins.length; i++) {
        let plugin = plugins[i];
        if (Array.isArray(plugin)) {
            assign(plugin, target);
            continue;
        }

        const name = plugin._name || plugin.name;
        if (!name) {
            throw Error(`Plugin must have a "name" or "_name" key.`);
        }

        target[name] = plugin;
        plugin.init && plugin.init();
    }
};

export class PluginsContainer {
    plugins = {};

    constructor(plugins: Array<PluginType> = []) {
        assign(plugins, this.plugins);
    }

    byName(name: string): PluginType {
        return this.plugins[name];
    }

    byType(type: string): Array<PluginType> {
        return Object.values(this.plugins).filter((pl: PluginType) => pl.type === type);
    }

    register(...plugins: any) {
        assign(plugins, this.plugins);
    }

    unregister(name: string) {
        delete this.plugins[name];
    }
}
