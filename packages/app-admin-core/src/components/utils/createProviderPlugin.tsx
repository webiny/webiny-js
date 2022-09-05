import React from "react";
import { HigherOrderComponent } from "@webiny/react-composition";
import { Provider } from "~/components/core/Provider";

/**
 * Creates a component, which, when mounted, will register an admin app provider.
 * For more information, visit https://www.webiny.com/docs/admin-area/basics/framework.
 */
export function createProviderPlugin(hoc: HigherOrderComponent): React.FC {
    return function ProviderPlugin() {
        return <Provider hoc={hoc} />;
    };
}
