import { Plugin } from "./types";
import uniqid from "uniqid";

const isOptionsObject = item => item && !Array.isArray(item) && !item.type && !item.name;
const normalizeArgs = args => {
    let options = {};

    // Check if last item in the plugins array is actually an options object.
    if (isOptionsObject(args[args.length - 1])) {
        [options] = args.splice(-1, 1);
    }

    return [args, options];
};

const assign = (plugins: any, options, target: Object): void => {
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

export class PluginsContainer {
    plugins: Record<string, Plugin> = {};

    constructor(...args) {
        this.register(...args);
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

    register(...args: any): void {
        const [plugins, options] = normalizeArgs(args);
        assign(plugins, options, this.plugins);
    }

    unregister(name: string): void {
        delete this.plugins[name];
    }
}
