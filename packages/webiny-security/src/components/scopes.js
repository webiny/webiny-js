// @flow
import invariant from "invariant";
import { getUser } from "./userContainer";

export const hasScopes = (
    scopes: Array<string> | { [string]: Array<string> }
): Object | boolean => {
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

export const HasScopes = ({ children, scopes }: Object) => {
    invariant(scopes, `"scopes" prop is missing in Scopes component.`);

    const result = hasScopes(scopes);

    if (typeof children === "function") {
        return children(result);
    }

    if (typeof result === "boolean") {
        return result ? children : null;
    }

    for (let resultKey in result) {
        if (!result[resultKey]) {
            return null;
        }
    }

    return children;
};
