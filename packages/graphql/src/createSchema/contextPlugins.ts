import { Context, ContextPlugin } from "@webiny/graphql/types";

export const applyContextPlugins = async (context: Context) => {
    const ctxPlugins = context.plugins.byType<ContextPlugin>("context");
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
};
