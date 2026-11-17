import { useContext } from "react";
import { PanelsContext } from "./PanelsContext.js";

/**
 * The open state of one panel, for the content inside it: the AI panel closes its own tab when its
 * close button is pressed, for example.
 */
export const usePanel = (name: string) => {
    const context = useContext(PanelsContext);
    if (!context) {
        throw new Error("usePanel() must be used inside the editor's panels.");
    }

    const isOpen = context.isOpen(name);

    return {
        isOpen,
        open: () => context.setOpen(name, true),
        close: () => context.setOpen(name, false),
        toggle: () => context.setOpen(name, !isOpen)
    };
};
