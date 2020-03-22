import createSchema from "../createHandler/createSchema";
import { PluginsContainer } from "@webiny/plugins/PluginsContainer";
import { applyGraphQLContextPlugins } from "../createHandler/contextPlugins";

export const setupSchema = async plugins => {
    const pluginsContainer = new PluginsContainer([plugins]);

    return await createSchema({ plugins: pluginsContainer });
};

export const setupContext = async (plugins, baseContext = {}) => {
    const pluginsContainer = new PluginsContainer([plugins]);

    const context = { ...baseContext, plugins: pluginsContainer };

    // Process `graphql-context` plugins
    await applyGraphQLContextPlugins(context);

    return context;
};
