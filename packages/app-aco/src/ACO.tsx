import React from "react";
import { Plugin } from "@webiny/app-admin";
import { FoldersApiProvider } from "~/contexts/foldersApi";

const FoldersApiProviderHOC = (Component: React.FC): React.FC => {
    return function FoldersApiProviderHOC({ children }) {
        return (
            <FoldersApiProvider>
                <Component>{children}</Component>
            </FoldersApiProvider>
        );
    };
};

export const ACO = () => {
    return <Plugin providers={[FoldersApiProviderHOC]} />;
};
