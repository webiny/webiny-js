import { Plugin } from "./types";
import { PluginConstructor, Plugin as PluginClass } from "./Plugin";
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
    private plugins: Record<string, Plugin> = {};
    private _byTypeCache: Record<string, Plugin[]> = {};

    constructor(...args) {
        this.register(...args);
    }

    public byName<T extends Plugin>(name: T["name"]): T {
        return this.plugins[name] as T;
    }

    public byType<TPlugin extends PluginClass>(plugin: PluginConstructor<TPlugin>): TPlugin[];
    public byType<T extends Plugin>(plugin: T["type"]): T[];
    public byType(plugin: PluginConstructor<PluginClass> | string): Plugin[] {
        const type = this.getPluginType(plugin);

        if (this._byTypeCache[type]) {
            return Array.from(this._byTypeCache[type]) as Plugin[];
        }
        const plugins = this.findByType(type);
        this._byTypeCache[type] = plugins;
        return Array.from(plugins);
    }

    public atLeastOneByType<TPlugin extends PluginClass>(
        plugin: PluginConstructor<TPlugin>
    ): TPlugin[];
    public atLeastOneByType<T extends Plugin>(plugin: T["type"]): T[];
    public atLeastOneByType(plugin: PluginConstructor<PluginClass> | string): Plugin[] {
        const list = this.byType(plugin as any);
        if (list.length === 0) {
            const type = this.getPluginType(plugin);
            throw new Error(`There are no plugins by type "${type}".`);
        }
        return list;
    }

    public oneByType<TPlugin extends PluginClass>(plugin: PluginConstructor<TPlugin>): TPlugin;
    public oneByType<T extends Plugin>(plugin: T["type"]): T;
    public oneByType(plugin: PluginConstructor<PluginClass> | string): Plugin {
        const list = this.atLeastOneByType(plugin as any);
        if (list.length > 1) {
            const type = this.getPluginType(plugin);
            throw new Error(
                `There is a requirement for plugin of type "${type}" to be only one registered.`
            );
        }
        return list[0];
    }

    public all<T extends Plugin>(): T[] {
        return Object.values(this.plugins) as T[];
    }

    public register(...args: any): void {
        // reset the cache when adding new plugins
        this._byTypeCache = {};
        const [plugins, options] = normalizeArgs(args);
        assign(plugins, options, this.plugins);
    }

    public unregister(name: string): void {
        // reset the cache when removing a plugin
        this._byTypeCache = {};
        delete this.plugins[name];
    }

    private getPluginType(plugin: PluginConstructor<PluginClass> | string) {
        return typeof plugin === "string" ? plugin : plugin.type;
    }

    private findByType<T extends Plugin>(type: T["type"]): T[] {
        return Object.values(this.plugins).filter((pl: Plugin) => pl.type === type) as T[];
    }
}
