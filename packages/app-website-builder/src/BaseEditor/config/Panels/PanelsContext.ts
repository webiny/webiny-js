import { createContext } from "react";

export interface PanelsContextValue {
    isOpen(name: string): boolean;
    setOpen(name: string, open: boolean): void;
}

export const PanelsContext = createContext<PanelsContextValue | null>(null);
