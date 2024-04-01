import React, { useContext } from "react";
import { Drawer, useDrawers } from "./DrawersProvider";

export interface DrawerContext {
    isOpen: boolean;
    close: () => void;
    open: () => void;
}

const DrawerContext = React.createContext<DrawerContext | undefined>(undefined);

interface DrawerProviderProps {
    drawer: Drawer;
    children: React.ReactNode;
}

export const DrawerProvider = ({ drawer, children }: DrawerProviderProps) => {
    const { isActive, setActive } = useDrawers();

    const context: DrawerContext = {
        isOpen: isActive(drawer.id),
        open: () => setActive(drawer.id),
        close: () => setActive(undefined)
    };

    return <DrawerContext.Provider value={context}>{children}</DrawerContext.Provider>;
};

export function useDrawer() {
    const context = useContext(DrawerContext);
    if (!context) {
        throw new Error(
            `Missing DrawerProvider in the component hierarchy! Are you using the "useDrawer()" hook in the right place?`
        );
    }

    return context;
}
