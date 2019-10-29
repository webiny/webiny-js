import { createSchema, PluginsContainer } from "../index";

export const setupSchema = async (plugins, config) => {
    if (typeof plugins === "function") {
        plugins = plugins(config);
    } else {
        plugins = plugins.map(pl => pl(config));
    }

    const pluginsContainer = new PluginsContainer([plugins]);

    const schema = await createSchema({ plugins: pluginsContainer, config });

    const context = { config, plugins: pluginsContainer };

    return {
        schema,
        context
    };
};
