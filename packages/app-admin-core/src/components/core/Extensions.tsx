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

export const ExtensionContext = createContext(null);
ExtensionContext.displayName = "ExtensionContext";

export function useExtension() {
    return useContext(ExtensionContext);
}

export const ExtensionsProvider = memo(function ExtensionsProvider({ children }) {
    /**
     * This context only serves as a safeguard. We need to warn users when they mount an extension without using
     * the <Extension> component. In that case, the context will not be available, and we can log warnings.
     */
    return <ExtensionContext.Provider value={true}>{children}</ExtensionContext.Provider>;
});

export const Extensions = ({ children }: { children: ReactNode }) => {
    const { addExtension } = useAdmin();
    const hasParentExtension = useExtension();

    useEffect(() => {
        if (hasParentExtension) {
            return;
        }

        Children.forEach(children, child => addExtension(child));
    }, []);

    return hasParentExtension ? <Fragment>{children}</Fragment> : null;
};
