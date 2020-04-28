import * as React from "react";
import { hasScopes } from "@webiny/app-security";
import { ResourcesType } from "../identity";

export default ({
    children,
    scopes
}: {
    children: any;
    scopes?: ResourcesType;
}): React.ReactElement => {
    const checkedScopes = scopes ? hasScopes(scopes) : true;

    if (typeof children === "function") {
        return children({ scopes: checkedScopes });
    }

    return checkedScopes ? children : null;
};
