import React, { Fragment, Children, createContext, useContext, useEffect, memo } from "react";
import { useApp } from "~/App";

export const PluginsContext = createContext<boolean>(false);
PluginsContext.displayName = "PluginsContext";

interface PluginsProviderComponentProps {
    children: JSX.Element[];
}
const PluginsProviderComponent: React.FC<PluginsProviderComponentProps> = ({ children }) => {
    /**
     * This context only serves as a safeguard. We need to warn users when they mount a plugin without using
     * the <Plugins> component. In that case, the context will not be available, and we can log warnings.
     */
    return <PluginsContext.Provider value={true}>{children}</PluginsContext.Provider>;
};

export const PluginsProvider = memo(PluginsProviderComponent);

export const Plugins: React.FC = ({ children }) => {
    const { addPlugin } = useApp();
    const hasParentPlugin = useContext(PluginsContext);

    useEffect(() => {
        if (hasParentPlugin) {
            return;
        }

        Children.forEach(children, child => addPlugin(child));
    }, []);

    return hasParentPlugin ? <Fragment>{children}</Fragment> : null;
};
