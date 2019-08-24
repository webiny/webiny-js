// @flow
import * as React from "react";

const { Provider, Consumer } = React.createContext({});
import type { PbProviderPropsType } from "@webiny/app-page-builder/types";

type ConsumerProps = {
    children: React.Element<any>
};

export const PageBuilderContextProvider = ({ children, ...rest }: PbProviderPropsType) => (
    <Provider value={rest}>{children}</Provider>
);

export const PageBuilderContextConsumer = ({ children }: ConsumerProps) => (
    <Consumer>{props => React.cloneElement(children, { pageBuilder: props })}</Consumer>
);
