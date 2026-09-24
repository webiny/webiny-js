import React from "react";
import {
    useFontColorPicker,
    useRichTextEditor,
    DropDown,
    INHERITED_FONT_COLOR
} from "@webiny/lexical-editor";
import { LexicalColorPicker } from "~/components/LexicalColorPicker/LexicalColorPicker.js";
import { ReactComponent as FontColorIcon } from "@webiny/icons/format_color_text.svg";

export interface LexicalColorPickerDropdownProps {
    allowCustomColor?: boolean;
}

export const LexicalColorPickerDropdown = ({
    allowCustomColor
}: LexicalColorPickerDropdownProps) => {
    const { value, applyColor } = useFontColorPicker();
    const { theme } = useRichTextEditor();

    return (
        <DropDown
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel={"Formatting options for text color"}
            buttonIcon={
                // Tint the A icon with the current font color. With no explicit colour we set
                // no inline fill at all, so the toolbar's own themed `.icon` rule applies --
                // an inline `fill: inherit` would override it and resolve to black.
                <FontColorIcon
                    className="icon"
                    style={value && value !== INHERITED_FONT_COLOR ? { fill: value } : undefined}
                />
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
    );
};
