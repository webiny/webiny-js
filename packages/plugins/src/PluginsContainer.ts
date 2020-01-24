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

    constructor(plugins: Plugin[] = []) {
        assign(plugins, this.plugins);
    }

    byName<T extends Plugin = Plugin>(name: string): T {
        return this.plugins[name] as T;
    }

    byType<T extends Plugin>(type?: string): T[] {
        if (!type) {
            return Object.values(this.plugins) as T[];
        }

        return Object.values(this.plugins).filter((pl: Plugin) => pl.type === type) as T[];
    }

    register(...plugins: any): void {
        assign(plugins, this.plugins);
    }

    unregister(name: string): void {
        delete this.plugins[name];
    }
}
