import { GraphQLFieldResolver } from "@webiny/graphql/types";
import SecurityError from "./SecurityError";

export default (scope: string) => {
    return (resolver: GraphQLFieldResolver) => {
        return (parent, args, ctx, info) => {
            if (process.env.NODE_ENV === "test") {
                return resolver(parent, args, ctx, info);
            }

            let allowAccess = false;

            const access = ctx.user && ctx.user.access;

            if (access) {
                allowAccess = access.fullAccess || access.scopes.includes(scope);
            }

            if (allowAccess) {
                return resolver(parent, args, ctx, info);
            }
            return new SecurityError();
        };
    };
};
