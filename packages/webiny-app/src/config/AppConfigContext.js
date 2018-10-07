// @flow
import React from "react";

const { Provider, Consumer } = React.createContext({});

export const AppConfigContextProvider = ({ config, children }) => (
    <Provider value={config}>{children}</Provider>
);

export const AppConfigContextConsumer = ({ children }) => (
    <Consumer>{config => React.cloneElement(children, { config })}</Consumer>
);
