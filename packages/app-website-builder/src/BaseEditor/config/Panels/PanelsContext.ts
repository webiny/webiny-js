import { createContext } from "react";

export interface PanelsContextValue {
    isOpen(name: string): boolean;
    setOpen(name: string, open: boolean): void;
}

export const PanelsContext = createContext<PanelsContextValue | null>(null);

export interface CurrentPanel {
    name: string;
    label: string;
}

/** The panel the content is rendered in. Absent outside a panel. */
export const CurrentPanelContext = createContext<CurrentPanel | null>(null);
