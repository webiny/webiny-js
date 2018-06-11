import React from "react";

const { Provider, Consumer } = React.createContext();

export const PageProvider = ({ page, children }) => {
    return <Provider value={page}>{children}</Provider>;
};

export function withPage() {
    return target => {
        const Component = props => {
            return <Consumer>{page => React.createElement(target, { ...props, page })}</Consumer>;
        };

        Component.displayName = target.name;

        return Component;
    };
}
