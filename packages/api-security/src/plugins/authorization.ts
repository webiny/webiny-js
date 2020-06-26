import { AuthorizationScopePlugin } from "../types";

const userAccessIncludesScope = ({ context, scope }) => {
    const access = context.user && context.user.access;

    if (access) {
        if (access.fullAccess || access.scopes.includes(scope)) {
            return true;
        }
    }

    return false;
};

const jwtPatAuthorization = {
    name: "authorization-hasScope-jwt-or-pat",
    type: "authorization",
    hasScope: async ({ context, scope }) => {
        return userAccessIncludesScope({ context, scope });
    }
} as AuthorizationScopePlugin;

export default [jwtPatAuthorization];
