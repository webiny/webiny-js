import { createSchema } from "../index";
import { PluginsContainer } from "@webiny/plugins/PluginsContainer";
import { applyContextPlugins } from "@webiny/graphql/createSchema/contextPlugins";

export const setupSchema = async plugins => {
    const pluginsContainer = new PluginsContainer([plugins]);

    return await createSchema({ plugins: pluginsContainer });
};

export const setupContext = async (plugins, baseContext = {}) => {
    const pluginsContainer = new PluginsContainer([plugins]);

    const context = { ...baseContext, plugins: pluginsContainer };

    // Process `graphql-context` plugins
    await applyContextPlugins(context);

    return context;
};
