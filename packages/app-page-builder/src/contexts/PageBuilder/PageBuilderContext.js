// @flow
import * as React from "react";

export const PageBuilderContext = React.createContext({});

export const PageBuilderProvider = ({ children, ...rest }: Object) => (
    <PageBuilderContext.Provider value={rest}>{children}</PageBuilderContext.Provider>
);

export const PageBuilderConsumer = ({ children }: Object) => (
    <PageBuilderContext.Consumer>
        {props => React.cloneElement(children, { pageBuilder: props })}
    </PageBuilderContext.Consumer>
);
