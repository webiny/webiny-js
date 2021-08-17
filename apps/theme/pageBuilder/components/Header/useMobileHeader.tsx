import React, { useCallback, useContext, useState } from "react";

export interface HeaderContextValue {
    mobileMenu: boolean;
    toggleMobileMenu: () => void;
}

export const HeaderContext = React.createContext(null);

export const HeaderContextProvider = ({ children }) => {
    const [mobileMenu, showMobileMenu] = useState(false);

    const toggleMobileMenu = useCallback(() => {
        showMobileMenu(!mobileMenu);
    }, [mobileMenu]);

    return (
        <HeaderContext.Provider value={{ mobileMenu, toggleMobileMenu }}>
            {children}
        </HeaderContext.Provider>
    );
};

export const useHeader = (): HeaderContextValue => {
    return useContext(HeaderContext);
};
