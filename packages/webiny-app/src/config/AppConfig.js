// @flow
import * as React from "react";
import { AppConfigContextProvider } from "./AppConfigContext";

type Props = {
    config: Object,
    children: React.Element<any>
};

const AppConfig = ({ config, children }: Props) => {
    return <AppConfigContextProvider config={config}>{children}</AppConfigContextProvider>;
};

export default AppConfig;
