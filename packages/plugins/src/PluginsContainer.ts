import { Plugin, PluginCollection } from "./types";
import uniqid from "uniqid";

const isOptionsObject = (item?: any) => item && !Array.isArray(item) && !item.type && !item.name;
const normalizeArgs = (args: any[]) => {
    let options = {};

    // Check if last item in the plugins array is actually an options object.
    if (isOptionsObject(args[args.length - 1])) {
        [options] = args.splice(-1, 1);
    }

    return [args, options];
};

const assign = (plugins: any, options: any, target: Record<string, any>): void => {
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

type Class<T> = new (plugin: Plugin) => T;

export class PluginDecorator<T extends Plugin = Plugin> {
    protected plugin: T;

    constructor(plugin: T) {
        this.plugin = plugin;
    }

    get type() {
        return this.plugin.type;
    }

    get name() {
        return this.plugin.name;
    }
}

export class PluginsContainer {
    private pluginDecorators: Record<string, Class<PluginDecorator>> = {};
    private plugins: Record<string, Plugin> = {};
    private _byTypeCache: Record<string, Plugin[]> = {};

    constructor(...args: PluginCollection) {
        this.register(...args);
    }

    public byName<T extends Plugin>(name: T["name"]): T | null {
        if (!name) {
            return null;
        }
        /**
         * We can safely cast name as string, we know it is so.
         */
        return this.decorate(this.plugins[name as string]) as T;
    }

    public byType<T extends Plugin>(type: T["type"]): T[] {
        if (this._byTypeCache[type]) {
            return Array.from(this._byTypeCache[type]) as T[];
        }
        const plugins = this.findByType<T>(type);
        this._byTypeCache[type] = plugins;
        return Array.from(plugins);
    }

    public atLeastOneByType<T extends Plugin>(type: T["type"]): T[] {
        const list = this.byType<T>(type);
        if (list.length === 0) {
            throw new Error(`There are no plugins by type "${type}".`);
        }
        return list;
    }

    public oneByType<T extends Plugin>(type: T["type"]): T {
        const list = this.atLeastOneByType<T>(type);
        if (list.length > 1) {
            throw new Error(
                `There is a requirement for plugin of type "${type}" to be only one registered.`
            );
        }
        return this.decorate(list[0]) as T;
    }

    public all<T extends Plugin>(): T[] {
        return Object.values(this.plugins).map(pl => this.decorate(pl)) as T[];
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

    public registerDecorator<T>(type: string, decorator: Class<T>) {
        // @ts-ignore
        this.pluginDecorators[type] = decorator;

        delete this._byTypeCache[type];
    }

    private findByType<T extends Plugin>(type: T["type"]): T[] {
        return (Object.values(this.plugins) as T[])
            .filter(pl => pl.type === type)
            .map(pl => this.decorate(pl)) as T[];
    }

    private decorate(plugin: Plugin) {
        const Decorator = this.pluginDecorators[plugin.type];
        if (!Decorator) {
            return plugin;
        }

        return new Decorator(plugin);
    }
}
