// @flow
const plugins = {};

export type PluginType = Object & {
    name: string,
    type: string
};

export const addPlugin = (...args: Array<PluginType>): void => {
    args.forEach(pl => {
        plugins[pl.name] = pl;
        pl.init && pl.init();
    });
};

export const getPlugins = (type: string): Array<PluginType> => {
    const values: Array<PluginType> = (Object.values(plugins): any);
    return values.filter((plugin: PluginType) => (type ? plugin.type === type : true));
};

export const getPlugin = (name: string): ?PluginType => {
    return plugins[name];
};

export const removePlugin = (name: string): void => {
    delete plugins[name];
};
