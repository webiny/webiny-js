import { HandlerPlugin } from "@webiny/handler/types";
import models from "../../models";

const getPermissions = async (data, context) => {
    const plugins = context.plugins.byType("access-manager-middleware");
    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        if (typeof plugin.getPermissions === "function") {
            const permissions = await plugin.getPermissions(data, context);
            if (Array.isArray(permissions)) {
                return permissions;
            }
        }
    }

    // If permissions were not fetched using plugins, fall back to loading permissions
    // using SecurityUser model. This is the default behavior.
    const { SecurityUser } = context.models;
    const user = await SecurityUser.findOne({ query: { id: data.identity } });
    if (!user) {
        throw Error(`User "${data.identity}" was not found!`);
    }

    return user.permissions;
};

const cache = {};

export default () => [
    models(),
    {
        type: "handler",
        name: "handler-access-manager",
        async handle({ args, context }) {
            const [{ action, ...data }] = args;

            try {
                if (action !== "getPermissions") {
                    throw Error(`Unsupported action "${action}"`);
                }

                if (cache[data.identity]) {
                    return { error: false, data: cache[data.identity] };
                }

                cache[data.identity] = await getPermissions(data, context);

                return { error: false, data: cache[data.identity] || [] };
            } catch (err) {
                console.log(err);
                return {
                    error: {
                        message: err.message
                    },
                    data: null
                };
            }
        }
    } as HandlerPlugin
];
