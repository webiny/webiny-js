import React from "react";
import { OptionsMenuItem } from "./OptionsMenuItem";

export interface OptionMenuItemProviderContext {
    MenuItem: typeof OptionsMenuItem;
}

const OptionMenuItemContext = React.createContext<OptionMenuItemProviderContext | undefined>(
    undefined
);

interface OptionMenuItemProviderProps {
    children: React.ReactNode;
}

export const OptionMenuItemProvider = ({ children }: OptionMenuItemProviderProps) => {
    return (
        <OptionMenuItemContext.Provider value={{ MenuItem: OptionsMenuItem }}>
            {children}
        </OptionMenuItemContext.Provider>
    );
};

export const useOptionMenuItem = (): OptionMenuItemProviderContext => {
    const context = React.useContext(OptionMenuItemContext);

    if (!context) {
        throw new Error("useOptionMenuItem must be used within a OptionMenuItemProvider");
    }

    return context;
};
