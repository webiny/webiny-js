// @flow
import * as React from "react";

const { Provider, Consumer } = React.createContext({});

type ProviderProps = {
    theme?: Object,
    editor?: boolean,
    children?: React.Node
};

type ConsumerProps = {
    children?: React.Node
};

export const CmsContextProvider = ({ theme, editor, children }: ProviderProps) => (
    <Provider value={{ theme, editor }}>{children}</Provider>
);

export const CmsContextConsumer = ({ children }: ConsumerProps) => (
    <Consumer>{props => React.cloneElement(children, props)}</Consumer>
);
