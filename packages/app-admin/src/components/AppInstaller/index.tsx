import { Provider } from "~/index";
import React from "react";
import { AppInstaller as Installer } from "./AppInstaller";
import { ComponentWithChildren } from "~/types";

interface AppInstallerProviderProps {
    children: React.ReactNode;
}

const AppInstallerHOC = (Component: ComponentWithChildren) => {
    return function AppInstallerProvider({ children }: AppInstallerProviderProps) {
        return (
            <Installer>
                <Component>{children}</Component>
            </Installer>
        );
    };
};

export const AppInstaller = () => {
    return <Provider hoc={AppInstallerHOC} />;
};
