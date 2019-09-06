// @flow
import * as React from "react";

export const PageBuilderContext = React.createContext({});

import type { PbProviderPropsType } from "@webiny/app-page-builder/types";

type ConsumerProps = {
    children: React.Element<any>
};

export const PageBuilderContextProvider = ({ children, ...rest }: PbProviderPropsType) => (
    <PageBuilderContext.Provider value={rest}>{children}</PageBuilderContext.Provider>
);

export const PageBuilderContextConsumer = ({ children }: ConsumerProps) => (
    <PageBuilderContext.Consumer>
        {props => React.cloneElement(children, { pageBuilder: props })}
    </PageBuilderContext.Consumer>
);
