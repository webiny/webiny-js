import { Provider } from "~/index";
import React from "react";
import { ComponentType } from "react";
import { AppInstaller as Installer } from "./AppInstaller";

const createAppInstaller =
    (Authentication: ComponentType<unknown>) => (Component: ComponentType<unknown>) => {
        return function AppInstallerProvider({ children }) {
            return (
                <Installer Authentication={Authentication}>
                    <Component>{children}</Component>
                </Installer>
            );
        };
    };

export interface AppInstallerProps {
    Authentication: ComponentType<unknown>;
}

export const AppInstaller = ({ Authentication }: AppInstallerProps) => {
    return <Provider hoc={createAppInstaller(Authentication)} />;
};
