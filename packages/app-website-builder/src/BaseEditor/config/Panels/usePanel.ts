import { useContext } from "react";
import { CurrentPanelContext } from "./PanelsContext.js";
import { PanelsContext } from "./PanelsContext.js";

/**
 * The open state of one panel, for the content inside it: the AI panel collapses itself when its
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

/**
 * The panel the calling content is rendered in, or `null` when it is not in one. For content that
 * also renders outside the panels and only offers a collapse button inside them.
 */
export const useCurrentPanel = () => {
    const panel = useContext(CurrentPanelContext);
    const context = useContext(PanelsContext);
    if (!panel || !context) {
        return null;
    }

    return {
        ...panel,
        close: () => context.setOpen(panel.name, false)
    };
};
