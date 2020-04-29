import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { ErrorResponse } from "@webiny/graphql";

export class SecurityError extends ErrorResponse {
    constructor(message: string) {
        super({
            code: "SECURITY_ERROR",
            message
        });
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
            return new SecurityError("Not authorized!");
        };
    };
};
