// @flow
import { rule } from "graphql-shield";
/**
 * Contains a list of all registered scopes throughout GraphQL Schema.
 * @type {Array}
 */
export const __scopes = ({
    registered: []
}: {
    registered: Array<string>
});

export const hasScope = (scope: string) => {
    registerScopes(scope);
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

export const registerScopes = (...scopes: Array<string>) => {
    scopes.forEach(scope => {
        __scopes.registered.includes(scope) === false && __scopes.registered.push(scope);
    });
};

export const getRegisteredScopes = () => {
    return __scopes.registered;
};
