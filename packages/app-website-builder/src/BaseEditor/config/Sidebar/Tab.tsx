import React from "react";
import styled from "@emotion/styled";
import { SegmentedControl } from "@webiny/admin-ui";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";

// Height of the tab header (the segmented control) above the scrollable content.
const TAB_HEADER_HEIGHT = 49;

export const TabContainer = styled("div")({
    display: "flex",
    position: "relative",
    flexDirection: "column",
    overflowY: "auto",
    // Style scrollbar
    "&::-webkit-scrollbar": {
        width: 8
    },
    "&::-webkit-scrollbar-track": {
        background: "transparent"
    },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: "var(--color-neutral-strong)",
        opacity: 0.7,
        borderRadius: 9999
    }
});

export interface TabProps {
    name: string;
    label: string;
    icon?: React.ReactElement;
    element: React.JSX.Element;
    disabled?: boolean;
    visible?: boolean;
}

export const Tab = ({ name, label, icon, disabled, element, visible }: TabProps) => {
    // The chrome above the editor content (top bar, etc.) is measured at runtime and stored as
    // `uiReservedSpace.height` — the same value the canvas uses (see PreviewContainer). Guessing
    // it (the old code assumed a fixed 44px) made the box overflow the viewport so its bottom
    // rows became unreachable. Use `max-height` with the measured value: the container hugs its
    // content when short (no empty gap) and scrolls once the content exceeds the available space.
    const uiHeight = useSelectFromEditor(state => state.uiReservedSpace.height);

    return (
        <SegmentedControl.Tabs.Tab
            value={name}
            trigger={label}
            icon={icon}
            disabled={disabled}
            visible={visible}
            content={
                <TabContainer
                    style={{ maxHeight: `calc(100vh - ${uiHeight}px - ${TAB_HEADER_HEIGHT}px)` }}
                >
                    {element}
                </TabContainer>
            }
        />
    );
};
