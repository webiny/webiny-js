import { Plugin } from "@webiny/plugins/types";

export default async (plugins: Plugin[], hook: string, context, ...args) => {
    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        if (typeof plugin[hook] === "function") {
            await plugin[hook](context, ...args);
        }
    }
};
