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

        if (ctx.user.scopes.includes("super_admin")) {
            return true;
        }

        return ctx.user.scopes.includes(scope);
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
