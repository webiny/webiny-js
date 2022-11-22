import React from "react";

import { createProviderPlugin } from "@webiny/app-admin";
import { FoldersProvider as FoldersContextProvider } from "./folders";
import { LinksProvider as LinksContextProvider } from "./links";

export const FoldersProvider = createProviderPlugin(Component => {
    return function FoldersProvider({ children }) {
        return (
            <FoldersContextProvider>
                <LinksContextProvider>
                    <Component>{children}</Component>
                </LinksContextProvider>
            </FoldersContextProvider>
        );
    };
});
