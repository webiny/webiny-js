import { createSchema } from "../index";
import { PluginsContainer } from "@webiny/plugins/PluginsContainer";
import { GraphQLContextPlugin } from "@webiny/api/types";

export const setupSchema = async plugins => {
    const pluginsContainer = new PluginsContainer([plugins]);

    return await createSchema({ plugins: pluginsContainer });
};

export const setupContext = async (plugins, baseContext = {}) => {
    const pluginsContainer = new PluginsContainer([plugins]);

    const context = { ...baseContext, plugins: pluginsContainer };

    // Process `graphql-context` plugins
    const ctxPlugins = pluginsContainer.byType<GraphQLContextPlugin>("graphql-context");
    for (let i = 0; i < ctxPlugins.length; i++) {
        if (typeof ctxPlugins[i].preApply === "function") {
            await ctxPlugins[i].preApply(context);
        }
    }

    for (let i = 0; i < ctxPlugins.length; i++) {
        if (typeof ctxPlugins[i].apply === "function") {
            await ctxPlugins[i].apply(context);
        }
    }

    for (let i = 0; i < ctxPlugins.length; i++) {
        if (typeof ctxPlugins[i].postApply === "function") {
            await ctxPlugins[i].postApply(context);
        }
    }

    return context;
};
