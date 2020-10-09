import { Context } from "@webiny/graphql/types";
import { HandlerPlugin } from "@webiny/handler/types";
import { PermissionsManagerMiddlewarePlugin } from "../types";

const getPermissions = async (data, context: Context) => {
    const plugins = context.plugins.byType<PermissionsManagerMiddlewarePlugin>(
        "permissions-manager-middleware"
    );

    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        if (typeof plugin.getPermissions === "function") {
            const permissions = await plugin.getPermissions(data, context);
            if (Array.isArray(permissions)) {
                console.log(`Loaded ${permissions.length} permissions.`);
                return permissions;
            }
            console.log(`No permissions loaded.`);
        }
    }

    console.log(`No permissions were loaded after processing all plugins!`);
    return [];
};

const cache = {};

export default ({ cache: useCache = true } = {}): HandlerPlugin => ({
    type: "handler",
    name: "handler-permissions-manager",
    async handle(context) {
        const { action, ...data } = context.invocationArgs;
        console.log(`event`, context.invocationArgs);

        try {
            if (action !== "getPermissions") {
                throw Error(`Unsupported action "${action}"`);
            }

            let permissions = [];

            if (useCache) {
                const cacheKey = data.identity || data.type;

                if (cache[cacheKey]) {
                    return { error: false, data: cache[cacheKey] };
                }

                permissions = await getPermissions(data, context);

                cache[cacheKey] = permissions;
            } else {
                permissions = await getPermissions(data, context);
            }

            return { error: false, data: permissions };
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
});
