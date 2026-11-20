import { useContext } from "react";
import { CurrentPanelContext } from "./PanelsContext.js";
import { PanelsContext } from "./PanelsContext.js";

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
