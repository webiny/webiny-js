// @flow
import * as React from "react";

const { Provider, Consumer } = React.createContext({});

type ContextProps = {
    config: Object,
    children: React.Element<any>
};

type ProviderProps = {
    children: React.Element<any>
};

export const AppConfigContextProvider = ({ config, children }: ContextProps) => (
    <Provider value={config}>{children}</Provider>
);

export const AppConfigContextConsumer = ({ children }: ProviderProps) => (
    <Consumer>{config => React.cloneElement(children, { config })}</Consumer>
);
