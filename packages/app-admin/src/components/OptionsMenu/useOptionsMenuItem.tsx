import React from "react";
import { OptionsMenuItem } from "./OptionsMenuItem";
import { OptionsMenuLink } from "./OptionsMenuLink";

export interface OptionsMenuItemProviderContext {
    OptionsMenuItem: typeof OptionsMenuItem;
    OptionsMenuLink: typeof OptionsMenuLink;
}

const OptionsMenuItemContext = React.createContext<OptionsMenuItemProviderContext | undefined>(
    undefined
);

interface OptionsMenuItemProviderProps {
    children: React.ReactNode;
}

export const OptionsMenuItemProvider = ({ children }: OptionsMenuItemProviderProps) => {
    return (
        <OptionsMenuItemContext.Provider value={{ OptionsMenuItem, OptionsMenuLink }}>
            {children}
        </OptionsMenuItemContext.Provider>
    );
};

export const useOptionsMenuItem = (): OptionsMenuItemProviderContext => {
    const context = React.useContext(OptionsMenuItemContext);

    if (!context) {
        throw new Error("useOptionsMenuItem must be used within a OptionsMenuItemProvider");
    }

    return context;
};
