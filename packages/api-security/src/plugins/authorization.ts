import { AuthorizationScopePlugin } from "../types";

const userAccessIncludesScope = ({ context, scope }) => {
    const access = context.security.user && context.security.user.access;

    if (access) {

        if (access.fullAccess || access.scopes.includes(scope)) {
            return true;
        }
    }

    return false;
};

const jwtPatAuthorization = {
    name: "authorization-has-scope-context-security-user",
    type: "authorization",
    hasScope: async ({ context, scope }) => {
        return userAccessIncludesScope({ context, scope });
    }
} as AuthorizationScopePlugin;

export default [jwtPatAuthorization];
