// @flow
import { hasScopes } from "@webiny/app-security";

export default ({ children, scopes }: Object) => {
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
