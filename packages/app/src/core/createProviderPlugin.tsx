import React from "react";
import { HigherOrderComponent } from "@webiny/react-composition";
import { Provider } from "./Provider";

/**
 * Creates a component, which, when mounted, will register an app provider.
 * This is particularly useful for wrapping the entire app with custom React Context providers.
 * For more information, visit https://www.webiny.com/docs/admin-area/basics/framework.
 */
export function createProviderPlugin(hoc: HigherOrderComponent) {
    return function ProviderPlugin() {
        return <Provider hoc={hoc} />;
    };
}
