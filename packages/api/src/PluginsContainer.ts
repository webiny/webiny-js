import { Plugin } from "./types";

const assign = (plugins: any, target: Object): void => {
    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
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
    plugins: Record<string, Plugin> = {};

    constructor(plugins: Array<Plugin> = []) {
        assign(plugins, this.plugins);
    }

    byName(name: string): Plugin {
        return this.plugins[name];
    }

    byType(type: string): Array<Plugin> {
        return Object.values(this.plugins).filter((pl: Plugin) => pl.type === type);
    }

    register(...plugins: any): void {
        assign(plugins, this.plugins);
    }

    unregister(name: string): void {
        delete this.plugins[name];
    }
}
