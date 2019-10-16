import React, { useMemo } from "react";
import { getPlugins } from "@webiny/plugins";
import Install from "./Install";

export const SecureInstall = ({ children }) => {
    const plugins = useMemo(() => {
        return getPlugins("install").filter(pl => pl.secure === true);
    }, []);

    return <Install plugins={plugins}>{children}</Install>;
};
