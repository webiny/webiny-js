import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

interface CommandPaletteContextValue {
    open: boolean;
    openPalette: () => void;
    closePalette: () => void;
    togglePalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | undefined>(undefined);

/**
 * Holds the palette's open state so both the global hotkey (inside <CommandPalette/>)
 * and the header trigger button can drive it.
 */
export const CommandPaletteProvider = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);

    const openPalette = useCallback(() => setOpen(true), []);
    const closePalette = useCallback(() => setOpen(false), []);
    const togglePalette = useCallback(() => setOpen(prev => !prev), []);

    const value = useMemo<CommandPaletteContextValue>(
        () => ({ open, openPalette, closePalette, togglePalette }),
        [open, openPalette, closePalette, togglePalette]
    );

    return (
        <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>
    );
};

export const useCommandPalette = () => {
    const context = useContext(CommandPaletteContext);
    if (!context) {
        throw new Error("useCommandPalette must be used within a CommandPaletteProvider.");
    }
    return context;
};
