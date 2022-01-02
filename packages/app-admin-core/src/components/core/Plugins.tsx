import React, {
    Fragment,
    Children,
    createContext,
    ReactNode,
    useContext,
    useEffect,
    memo
} from "react";
import { useAdmin } from "~/admin";

export const PluginsContext = createContext(null);
PluginsContext.displayName = "PluginsContext";

export const PluginsProvider = memo(function PluginsProvider({ children }) {
    /**
     * This context only serves as a safeguard. We need to warn users when they mount a plugin without using
     * the <Plugins> component. In that case, the context will not be available, and we can log warnings.
     */
    return <PluginsContext.Provider value={true}>{children}</PluginsContext.Provider>;
});

export const Plugins = ({ children }: { children: ReactNode }) => {
    const { addPlugin } = useAdmin();
    const hasParentPlugin = useContext(PluginsContext);

    useEffect(() => {
        if (hasParentPlugin) {
            return;
        }

        Children.forEach(children, child => addPlugin(child));
    }, []);

    return hasParentPlugin ? <Fragment>{children}</Fragment> : null;
};
