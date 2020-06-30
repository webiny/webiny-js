import { GraphQLFieldResolver } from "@webiny/graphql/types";
import SecurityError from "./SecurityError";

export default (scope: string) => {
    return (resolver: GraphQLFieldResolver) => {
        return async (parent, args, context, info) => {
            if (process.env.NODE_ENV === "test") {
                return resolver(parent, args, context, info);
            }

            const scopeAuthorizationPlugins = context.plugins.byType("authorization");
            for (let plugin of scopeAuthorizationPlugins) {
                if (await plugin.hasScope({ context, scope })) {
                    return resolver(parent, args, context, info);
                }
            }

            return new SecurityError(); // The scopes couldn't be authorized with the given JWT / PAT / AT
        };
    };
};
