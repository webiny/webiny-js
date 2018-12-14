// @flow
import * as React from "react";

const { Provider, Consumer } = React.createContext({});
import type { CmsProviderPropsType } from "webiny-app-cms/types";

type ConsumerProps = {
    children: React.Element<any>
};

export const CmsContextProvider = ({ children, ...rest }: CmsProviderPropsType) => (
    <Provider value={rest}>{children}</Provider>
);

export const CmsContextConsumer = ({ children }: ConsumerProps) => (
    <Consumer>{props => React.cloneElement(children, { cms: props })}</Consumer>
);
