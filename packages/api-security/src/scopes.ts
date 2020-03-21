import { rule } from "graphql-shield";

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
