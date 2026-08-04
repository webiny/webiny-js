import React from "react";
import { useFontColorPicker, useRichTextEditor, DropDown } from "@webiny/lexical-editor";
import { LexicalColorPicker } from "~/components/LexicalColorPicker/LexicalColorPicker.js";

export interface LexicalColorPickerDropdownProps {
    allowCustomColor?: boolean;
}

export const LexicalColorPickerDropdown = ({
    allowCustomColor
}: LexicalColorPickerDropdownProps) => {
    const { value, applyColor } = useFontColorPicker();
    const { theme } = useRichTextEditor();

    // The current color is dynamic, so it's passed as a CSS custom property on a
    // `display: contents` wrapper (no layout box) and read by the icon's static class.
    const wrapperStyle = { display: "contents", "--wby-font-color": value } as React.CSSProperties;

    return (
        <span style={wrapperStyle}>
            <DropDown
                buttonClassName="toolbar-item color-picker"
                buttonAriaLabel={"Formatting options for text color"}
                buttonIconClassName={
                    "icon font-color [border-bottom:3px_solid_var(--wby-font-color)]"
                }
                stopCloseOnClickSelf={true}
                disabled={false}
                showScroll={false}
            >
                <LexicalColorPicker
                    value={value}
                    onChangeComplete={applyColor}
                    allowCustomColor={allowCustomColor ?? theme.allowCustomColors}
                />
            </DropDown>
        </span>
    );
};
