import React from "react";
import { createProvider, Provider } from "@webiny/app";
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
