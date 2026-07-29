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

    return (
        <DropDown
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel={"Formatting options for text color"}
            buttonIcon={
                // Tint the toolbar icon with the current font color so the active color
                // shows on the button itself, not only inside the dropdown.
                <FontColorIcon className="icon" style={value ? { fill: value } : undefined} />
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
    );
};
