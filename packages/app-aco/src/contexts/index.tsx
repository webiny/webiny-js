import React from "react";

import { createProviderPlugin } from "@webiny/app-admin";
import { FoldersProvider as FoldersContextProvider } from "./folders";
import { SearchRecordsProvider as SearchRecordsContextProvider } from "./records";

export const ACOProvider = createProviderPlugin(Component => {
    return function FoldersProvider({ children }) {
        return (
            <FoldersContextProvider>
                <SearchRecordsContextProvider>
                    <Component>{children}</Component>
                </SearchRecordsContextProvider>
            </FoldersContextProvider>
        );
    };
});
