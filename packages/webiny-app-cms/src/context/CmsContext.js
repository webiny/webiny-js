// @flow
import * as React from "react";

const { Provider, Consumer } = React.createContext({});

type ProviderProps = {
    theme?: Object,
    isEditor?: boolean,
    children?: React.Node
};

type ConsumerProps = {
    children: React.Element<any>
};

export const CmsContextProvider = ({ theme, isEditor, children }: ProviderProps) => (
    <Provider value={{ theme, isEditor }}>{children}</Provider>
);

export const CmsContextConsumer = ({ children }: ConsumerProps) => (
    <Consumer>{props => React.cloneElement(children, { cms: props })}</Consumer>
);
