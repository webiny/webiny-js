import * as React from "react";
import { hasScopes } from "@webiny/app-security";
import { getPlugin } from "@webiny/plugins";
import { ResourcesType } from "../identity";
import { SecureRouteErrorPlugin } from "@webiny/app-security/types";

export default ({
    children,
    scopes
}: {
    children: any;
    scopes?: ResourcesType;
}): React.ReactElement => {
    const checkedScopes = scopes ? hasScopes(scopes, { forceBoolean: true }) : true;

    if (checkedScopes) {
        return children;
    }

    const plugin = getPlugin("secure-route-error") as SecureRouteErrorPlugin;
    if (!plugin) {
        return <span>You are not authorized to view this route.</span>;
    }
    return plugin.render();
};
