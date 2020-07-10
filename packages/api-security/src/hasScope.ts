import { GraphQLFieldResolver } from "@webiny/graphql/types";
import SecurityError from "./SecurityError";

export default (scope: string) => {
    return (resolver: GraphQLFieldResolver) => {
        return async (parent, args, context, info) => {
            const scopeAuthorizationPlugins = context.plugins.byType("authorization");
            for (const plugin of scopeAuthorizationPlugins) {
                if (await plugin.hasScope({ context, scope })) {
                    return resolver(parent, args, context, info);
                }
            }

            return new SecurityError(`Not authorized (scope "${scope}" not found).`);
        };
    };
};
