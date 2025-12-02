import React from "react";
import { createProvider, Provider } from "~/index.js";
import { SystemInstaller } from "./SystemInstaller.js";

const SystemInstallerHoc = createProvider(Original => {
    return function SystemInstallerProvider({ children }) {
        return (
            <SystemInstaller>
                <Original>{children}</Original>
            </SystemInstaller>
        );
    };
});

export const SystemInstallerProvider = () => {
    return <Provider hoc={SystemInstallerHoc} />;
};
