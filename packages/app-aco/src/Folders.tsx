import React from "react";
import { Plugin } from "@webiny/app-admin";
import { FoldersApiProvider } from "~/contexts/FoldersApi";

interface FoldersApiProviderHOCProps {
    children: React.ReactNode;
}

const FoldersApiProviderHOC = (Component: React.ComponentType<React.PropsWithChildren>) => {
    return function FoldersApiProviderHOC({ children }: FoldersApiProviderHOCProps) {
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
