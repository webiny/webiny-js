import React from "react";
import { ScrollArea, SegmentedControl } from "@webiny/admin-ui";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";

// Height of the tab header (the segmented control) above the scrollable content.
const TAB_HEADER_HEIGHT = 49;

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
    // it (the old code assumed a fixed 44px) made the scroll box overflow the viewport so its
    // bottom rows became unreachable. Use the measured value so the content fits exactly.
    const uiHeight = useSelectFromEditor(state => state.uiReservedSpace.height);

    return (
        <SegmentedControl.Tabs.Tab
            value={name}
            trigger={label}
            icon={icon}
            disabled={disabled}
            visible={visible}
            content={
                // Outer flex column capped at the available height: it hugs the content when
                // short (no empty gap) and clamps to the cap when tall. The ScrollArea then
                // fills that clamped height (flex-1 + min-h-0 gives it a definite height, which
                // radix needs to actually scroll) and scrolls the overflow.
                <div
                    className={"flex flex-col"}
                    style={{
                        maxHeight: `calc(100vh - ${uiHeight}px - ${TAB_HEADER_HEIGHT}px)`
                    }}
                >
                    <ScrollArea className={"flex-1 min-h-0"}>{element}</ScrollArea>
                </div>
            }
        />
    );
};
