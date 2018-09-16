// @flow
const plugins = {};

export type Plugin = {
    name: string,
    type: string,
    target?: Array<string>,
    ...Object
};

export const addPlugin = (...args: Array<Plugin>): void => {
    args.forEach(pl => {
        plugins[pl.name] = pl;
    });
};

export const getPlugins = (type: string): Array<Plugin> => {
    const values: Array<Plugin> = (Object.values(plugins): any);
    return values.filter((plugin: Plugin) => (type ? plugin.type === type : true));
};

export const getPlugin = (name: string): ?Plugin => {
    return plugins[name];
};

export const removePlugin = (name: string): void => {
    delete plugins[name];
};
