import React from "react";

const { Provider, Consumer } = React.createContext({ preview: false });

export const RenderContextProvider = ({ value, children }) => (
    <Provider value={value}>{children}</Provider>
);

export const RenderContextConsumer = ({ children }) => (
    <Consumer>{value => React.cloneElement(children, { ...value })}</Consumer>
);
