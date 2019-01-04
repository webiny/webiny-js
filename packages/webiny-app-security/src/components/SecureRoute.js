// @flow
import * as React from "react";
import { hasScopes } from "webiny-app-security";
import { getPlugin } from "webiny-plugins";

export default ({ children, scopes }: Object): React.Node => {
    const result = hasScopes(scopes);

    const errorPlugin = getPlugin("secure-route-error");
    let error = null;
    if (!errorPlugin) {
        error = <span>You are not authorized to view this route.</span>;
    } else {
        error = errorPlugin.render();
    }

    if (typeof result === "boolean") {
        return result ? children : error;
    }

    for (let resultKey in result) {
        if (!result[resultKey]) {
            return error;
        }
    }

    return children;
};
