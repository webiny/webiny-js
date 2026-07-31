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
        width: 1
    },
    "&::-webkit-scrollbar-track": {
        boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.3)"
    },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: "darkgrey",
        outline: "1px solid slategrey"
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
    // `uiReservedSpace.height` — the same value the canvas uses (see PreviewContainer). The old
    // code guessed this at a fixed 44px, so when the real chrome was taller the scroll box
    // overflowed the viewport and its bottom rows became unreachable. Use the measured value.
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
                    style={{ height: `calc(100vh - ${uiHeight}px - ${TAB_HEADER_HEIGHT}px)` }}
                >
                    {element}
                </TabContainer>
            }
        />
    );
};
