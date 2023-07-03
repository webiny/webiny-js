import React from "react";
import { Plugin } from "@webiny/app-admin";
import { FoldersApiProvider } from "~/contexts/FoldersApi";

const FoldersApiProviderHOC = (Component: React.FC): React.FC => {
    return function FoldersApiProviderHOC({ children }) {
        return (
            <FoldersApiProvider>
                <Component>{children}</Component>
            </FoldersApiProvider>
        );
    };
};

export const Folders = () => {
    return <Plugin providers={[FoldersApiProviderHOC]} />;
};
