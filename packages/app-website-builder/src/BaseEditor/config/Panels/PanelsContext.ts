import { createContext } from "react";
import type { PanelSide } from "./types.js";

export interface PanelsContextValue {
    isOpen(name: string): boolean;
    setOpen(name: string, open: boolean): void;
}

export const PanelsContext = createContext<PanelsContextValue | null>(null);

export interface CurrentPanel {
    name: string;
    label: string;
    side: PanelSide;
}

/** The panel the content is rendered in. Absent outside a panel. */
export const CurrentPanelContext = createContext<CurrentPanel | null>(null);
