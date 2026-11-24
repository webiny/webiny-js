import React from "react";
import { useFontColorPicker, useRichTextEditor, DropDown } from "@webiny/lexical-editor";
import { LexicalColorPicker } from "~/components/LexicalColorPicker/LexicalColorPicker.js";
import { ReactComponent as FontColorIcon } from "@webiny/icons/format_color_text.svg";

export interface LexicalColorPickerDropdownProps {
    allowCustomColor?: boolean;
}

export const LexicalColorPickerDropdown = ({
    allowCustomColor
}: LexicalColorPickerDropdownProps) => {
    const { value, isDefault, applyColor } = useFontColorPicker();
    // Tint the A icon with the selected text's font color; without one it's drawn like the
    // other toolbar icons.
    const tint = value && !isDefault ? { fill: value } : undefined;
    const { theme } = useRichTextEditor();

    return (
        <DropDown
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel={"Formatting options for text color"}
            buttonIcon={<FontColorIcon className="icon" style={tint} />}
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
    );
};
