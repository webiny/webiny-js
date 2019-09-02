import React from "react";
export const PageDetailsContext = React.createContext();

export const PageDetailsProvider = ({ value, children }: Object) => {
    return <PageDetailsContext.Provider value={value}>{children}</PageDetailsContext.Provider>;
};

export const PageDetailsConsumer = ({ children }: Object) => {
    if (typeof children === "function") {
        return (
            <PageDetailsContext.Consumer>
                {pageDetails => children(pageDetails)}
            </PageDetailsContext.Consumer>
        );
    }
    return (
        <PageDetailsContext.Consumer>
            {pageDetails => React.cloneElement(children, { pageDetails })}
        </PageDetailsContext.Consumer>
    );
};
