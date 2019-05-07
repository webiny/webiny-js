import React from "react";
const { Provider, Consumer } = React.createContext();

export const FormDetailsProvider = ({ value, children }: Object) => {
    return <Provider value={value}>{children}</Provider>;
};

export const FormDetailsConsumer = ({ children }: Object) => {
    if (typeof children === "function") {
        return <Consumer>{formDetails => children(formDetails)}</Consumer>;
    }
    return <Consumer>{formDetails => React.cloneElement(children, { formDetails })}</Consumer>;
};
