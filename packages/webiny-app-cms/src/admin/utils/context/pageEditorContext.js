import React from "react";

const { Provider, Consumer } = React.createContext();

export const PageEditorProvider = ({ value, children }) => {
    return <Provider value={value}>{children}</Provider>;
};

export function withPageEditor() {
    return target => {
        const Component = props => {
            return (
                <Consumer>
                    {pageEditor => React.createElement(target, { ...props, pageEditor })}
                </Consumer>
            );
        };

        Component.displayName = target.name;

        return Component;
    };
}
