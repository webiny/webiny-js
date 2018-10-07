// @flow
import React from "react";
import { AppConfigContextProvider } from "./AppConfigContext";

const AppConfig = ({ config, children }) => {
    return <AppConfigContextProvider config={config}>{children}</AppConfigContextProvider>
};

export default AppConfig;