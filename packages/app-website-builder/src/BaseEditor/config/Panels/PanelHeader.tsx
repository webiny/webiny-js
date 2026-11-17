import React from "react";
import { IconButton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as LeftPanelIcon } from "@webiny/icons/left_panel_open.svg";
import { ReactComponent as RightPanelIcon } from "@webiny/icons/right_panel_open.svg";
import { useCurrentPanel } from "./usePanel.js";

/**
 * The panel's label and its collapse button, for content that renders inside a panel. Renders
 * nothing outside one. The button lines up with the open button on the collapsed strip
 * (`CollapsedPanel`), so it stays put when the panel is toggled: both centre it 28px from the top,
 * where `SidePanel`, the AI assistant's header, has its close button. `data-panel-collapse` is how
 * `PanelSlot` finds it to move focus to it after the panel opens.
 */
export const PanelHeader = () => {
    const panel = useCurrentPanel();
    if (!panel) {
        return null;
    }

    return (
        <div className={"flex h-[40px] flex-none items-center justify-between"}>
            <Text as="div" size={"sm"} className={"font-semibold text-neutral-primary"}>
                {panel.label}
            </Text>
            <IconButton
                variant={"ghost"}
                size={"xs"}
                icon={panel.side === "left" ? <RightPanelIcon /> : <LeftPanelIcon />}
                title={`Collapse ${panel.label}`}
                data-panel-collapse
                onClick={panel.close}
            />
        </div>
    );
};
