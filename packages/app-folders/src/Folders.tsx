import React from "react";
import { createProviderPlugin } from "@webiny/app-admin";
import { FoldersProvider as ContextProvider } from "./contexts/Folders";

export { useFolders } from "./hooks/useFolders";
export { FolderTree } from "./components/Tree";

export const FoldersProvider = createProviderPlugin(Component => {
    return function FoldersProvider({ children }) {
        return (
            <ContextProvider>
                <Component>{children}</Component>
            </ContextProvider>
        );
    };
});
