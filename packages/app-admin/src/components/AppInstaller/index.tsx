import { Provider } from "~/index";
import React from "react";
import { ComponentType } from "react";
import { AppInstaller as Installer } from "./AppInstaller";

interface AppInstallerProviderProps {
    children: React.ReactNode;
}

const AppInstallerHOC = (Component: ComponentType<unknown>) => {
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
