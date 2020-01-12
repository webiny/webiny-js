import { createSchema, PluginsContainer } from "../index";

export const setupSchema = async plugins => {
    const pluginsContainer = new PluginsContainer([plugins]);

    const schema = await createSchema({ plugins: pluginsContainer });

    const context = { plugins: pluginsContainer };

    return {
        schema,
        context
    };
};
