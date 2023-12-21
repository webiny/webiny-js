import { Plugin, PluginCollection, PluginFactory, PluginsContainer } from "~/types";

const isPluginLoader = (value: unknown): value is PluginFactory => {
    return typeof value === "function";
};

export class AsyncPluginsContainer {
    private readonly plugins: PluginCollection;
    private pluginsContainer: PluginsContainer | undefined;

    constructor(plugins: PluginCollection | PluginsContainer) {
        this.plugins = plugins instanceof PluginsContainer ? plugins.all() : plugins;
    }

    async init() {
        if (this.pluginsContainer) {
            return this.pluginsContainer;
        }

        const plugins = await this.traverseAndLoadPlugins(this.plugins);
        this.pluginsContainer = new PluginsContainer(plugins);

        return this.pluginsContainer;
    }

    private async traverseAndLoadPlugins(plugins: Plugin | PluginCollection): Promise<Plugin[]> {
        if (!Array.isArray(plugins)) {
            return [plugins];
        }

        return plugins.reduce<Promise<Plugin[]>>((acc, item) => {
            return acc.then(async plugins => {
                if (isPluginLoader(item)) {
                    const lazyPlugins = await item();
                    return [...plugins, ...(await this.traverseAndLoadPlugins(lazyPlugins))];
                }

                return [...plugins, ...(await this.traverseAndLoadPlugins(item))];
            });
        }, Promise.resolve([]));
    }
}
