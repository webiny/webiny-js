// @flow
import { getUser } from "./userContainer";

export default (scopes: Array<string> | { [string]: Array<string> }): Object | boolean => {
    if (!scopes) {
        throw new Error(
            "Scopes missing (received " +
                scopes +
                "). First argument must be a list of scopes or a plain object with multiple lists of scopes."
        );
    }

    const user = getUser();
    if (Array.isArray(scopes)) {
        if (!user || !user.scopes) {
            return false;
        }

        if (user.scopes.includes("super_admin")) {
            return true;
        }

        for (let i = 0; i < scopes.length; i++) {
            let scope = scopes[i];
            if (!user.scopes.includes(scope)) {
                return false;
            }
        }

        return true;
    }

    const result = {};
    if (!user || !user.scopes) {
        for (let scopesKey in scopes) {
            result[scopesKey] = false;
        }
        return result;
    }

    if (user.scopes.includes("super_admin")) {
        for (let scopesKey in scopes) {
            result[scopesKey] = true;
        }
        return result;
    }

    for (let scopesKey in scopes) {
        result[scopesKey] = true;
        const scopesToCheck: Array<string> = scopes[scopesKey];
        for (let i = 0; i < scopesToCheck.length; i++) {
            let scopeToCheck = scopesToCheck[i];
            if (!user.scopes.includes(scopeToCheck)) {
                result[scopesKey] = false;
                break;
            }
        }
    }

    return result;
};
