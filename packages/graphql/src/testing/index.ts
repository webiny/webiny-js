import { createSchema } from "../index";
import { PluginsContainer } from "@webiny/plugins/PluginsContainer";

// TODO: probably can go to trash.
const applyContextPlugins = async context => {
    const ctxPlugins = context.plugins.byType("context");
    for (let i = 0; i < ctxPlugins.length; i++) {
        if (typeof ctxPlugins[i].apply === "function") {
            await ctxPlugins[i].apply(context);
        }
    }
};

export const setupSchema = async plugins => {
    const pluginsContainer = new PluginsContainer([plugins]);

    return await createSchema({ plugins: pluginsContainer });
};

export const setupContext = async (plugins, baseContext = {}) => {
    const pluginsContainer = new PluginsContainer([plugins]);

    const context = { ...baseContext, plugins: pluginsContainer };

    // Process `context` plugins
    await applyContextPlugins(context);

    return context;
};
