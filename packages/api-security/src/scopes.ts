import { GraphQLFieldResolver } from "@webiny/graphql/types";

export class ScopeError extends Error {
    message: string;
    constructor(message: string) {
        super();
        this.message = message;
    }
}

export const hasScope = (scope: string) => {
    return (resolver: GraphQLFieldResolver) => {
        return (parent, args, ctx, info) => {
            let allowAccess = false;

            const access = ctx.user && ctx.user.access;

            if (access) {
                allowAccess = access.fullAccess || access.scopes.includes(scope);
            }

            if (allowAccess) {
                return resolver(parent, args, ctx, info);
            }
            throw new ScopeError(`Not Authorized!`);
        };
    };
};
