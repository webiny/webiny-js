import React from "react";
import { CollapsibleSidePanelHeader } from "@webiny/admin-ui";
import { useCurrentPanel } from "./useCurrentPanel.js";

/**
 * The panel's label and its collapse button, for content that renders inside a panel. Renders
 * nothing outside one.
 */
export const PanelHeader = () => {
    const panel = useCurrentPanel();
    if (!panel) {
        return null;
    }

    return (
        <CollapsibleSidePanelHeader
            label={panel.label}
            side={panel.side}
            onCollapse={panel.close}
        />
    );
};
