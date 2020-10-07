import * as React from "react";
import { hasScopes } from "@webiny/app-security";
import { getPlugin } from "@webiny/plugins";
import { ResourcesType } from "../identity";
import { SecureRouteErrorPlugin } from "@webiny/app-security/types";
import NotAuthorizedError from "@webiny/app-security/components/NotAuthorizedError";

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

    const plugin = getPlugin<SecureRouteErrorPlugin>("secure-route-error");
    if (!plugin) {
        return <NotAuthorizedError />;
    }
    return plugin.render();
};
