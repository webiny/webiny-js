import React from "react";
import { useFontColorPicker, DropDown } from "@webiny/lexical-editor";
import { LexicalColorPicker } from "~/components/LexicalColorPicker/LexicalColorPicker.js";
import { ReactComponent as FontColorIcon } from "@webiny/icons/format_color_text.svg";

export interface LexicalColorPickerDropdownProps {
    allowCustomColor?: boolean;
}

export const LexicalColorPickerDropdown = ({
    allowCustomColor = false
}: LexicalColorPickerDropdownProps) => {
    const { value, applyColor } = useFontColorPicker();

    // The current color is dynamic, so it's passed as a CSS custom property on a
    // `display: contents` wrapper (no layout box) and read by the icon's static class.
    const wrapperStyle = { display: "contents", "--wby-font-color": value } as React.CSSProperties;

    return (
        <span style={wrapperStyle}>
            <DropDown
                buttonClassName="toolbar-item color-picker"
                buttonAriaLabel={"Formatting options for text color"}
                buttonIcon={
                    <FontColorIcon className="icon [border-bottom:3px_solid_var(--wby-font-color)]" />
                }
                stopCloseOnClickSelf={true}
                disabled={false}
                showScroll={false}
            >
                <LexicalColorPicker
                    value={value}
                    onChangeComplete={applyColor}
                    allowCustomColor={allowCustomColor}
                />
            </DropDown>
        </span>
    );
};
