import React, { useContext, useEffect, useState } from "react";
import { useKeyHandler } from "~/editor/hooks/useKeyHandler";

export interface Drawer {
    id: string;
    element: JSX.Element;
}

export type Drawers = Drawer[];

export interface DrawerContext {
    drawers: Drawers;
    isActive: (id: string) => boolean;
    setActive: (id: string | undefined) => void;
    registerDrawer: (id: string, drawer: JSX.Element) => () => void;
}

const DrawerContext = React.createContext<DrawerContext | undefined>(undefined);

export interface DrawerProviderProps {
    children: React.ReactNode;
}

export const DrawersProvider = ({ children }: DrawerProviderProps) => {
    const [activeId, setActive] = useState<string | undefined>(undefined);
    const [drawers, setDrawers] = useState<Drawers>([]);

    const { removeKeyHandler, addKeyHandler } = useKeyHandler();

    useEffect(() => {
        addKeyHandler("escape", e => {
            e.preventDefault();
            setActive(undefined);
        });

        return () => {
            removeKeyHandler("escape");
        };
    });

    const context: DrawerContext = {
        drawers,
        isActive: id => activeId === id,
        setActive: id => setActive(id),
        registerDrawer: (id, element) => {
            setDrawers(drawers => [...drawers, { id, element }]);

            return () => {
                setDrawers(drawers => {
                    return drawers.filter(drawer => drawer.id !== id);
                });
            };
        }
    };
    return <DrawerContext.Provider value={context}>{children}</DrawerContext.Provider>;
};

export function useDrawers() {
    const context = useContext(DrawerContext);
    if (!context) {
        throw new Error(
            `Missing DrawersProvider in the component hierarchy! Are you using the "useDrawers()" hook in the right place?`
        );
    }

    return context;
}
