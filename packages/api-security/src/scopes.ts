import { rule } from "graphql-shield";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

export const hasScope = (scope: string) => {
    return rule()(async (parent, args, ctx) => {
        if (!ctx.user) {
            return false;
        }

        const access = await ctx.user.access;
        if (access.fullAccess) {
            return true;
        }

        return access.scopes.includes(scope);
    });
};

export const hasRole = (role: string) => {
    return rule()(async (parent, args, ctx) => {
        if (!ctx.user) {
            return false;
        }

        const access = await ctx.user.access;
        if (access.fullAccess) {
            return true;
        }

        return access.roles.includes(role);
    });
};

export const customHasScope = (scope: string) => {
    return (resolver: GraphQLFieldResolver) => {
        return (parent, args, ctx, info) => {
            let allowAccess = false;

            const access = ctx.user && ctx.user.access;

            if (access) {
                allowAccess = access.fullAccess || access.scopes.includes(scope);
            }

            if (allowAccess) {
                return resolver(parent, args, ctx, info);
            } else {
                throw Error(`Not Authorized! [hasScope] `);
            }
        };
    };
};
