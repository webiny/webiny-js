import React from "react";
const { Provider, Consumer } = React.createContext();

export const PageDetailsProvider = ({ value, children }: Object) => {
    return <Provider value={value}>{children}</Provider>;
};

export const PageDetailsConsumer = ({ children }: Object) => {
    if (typeof children === "function") {
        return <Consumer>{pageDetails => children(pageDetails)}</Consumer>;
    }
    return <Consumer>{pageDetails => React.cloneElement(children, { pageDetails })}</Consumer>;
};
