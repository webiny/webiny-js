import { GraphQLFieldResolver } from "@webiny/graphql/types";
import SecurityError from "./SecurityError";
// import { validateAccessToken } from "@webiny/api-headless-cms/content/plugins";

export default (scope: string) => {
    return (resolver: GraphQLFieldResolver) => {
        return async (parent, args, ctx, info) => {
            if (process.env.NODE_ENV === "test") {
                return resolver(parent, args, ctx, info);
            }

            let allowAccess = false;

            const access = ctx.user && ctx.user.access;

            // TODO [Andrei]: get authorization plugins (AT, PAT, JWT) and call them here
            // const authorizationScopesPlugin = ctx.plugins.ByType(...)
            // for(let plugin of authorizationScopesPlugin) {
            //     if(await plugin.hasScope({context: ctx, scope})) {
            //         return  resolver(parent, args, ctx, info);
            //     }
            // }

            if (access) {
                // TODO [Andrei]: move this inside the correct authorization plugin (JWT)
                allowAccess = access.fullAccess || access.scopes.includes(scope);
            }

            // if (ctx.cms.READ || ctx.cms.PREVIEW) {
            //     try {
            //         await validateAccessToken({ context: ctx });
            //         allowAccess = true;
            //     } catch (e) {
            //         return new SecurityError(e);
            //     }
            // }
            return new SecurityError();
        };
    };
};
