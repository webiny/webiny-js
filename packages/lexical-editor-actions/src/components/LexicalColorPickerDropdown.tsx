import React from "react";
import { useFontColorPicker, DropDown } from "@webiny/lexical-editor";
import { LexicalColorPicker } from "~/components/LexicalColorPicker/LexicalColorPicker.js";

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
                // Show the current font color as a swatch box on the toolbar button.
                <span
                    className="size-4 rounded-[2px] border-2"
                    style={{
                        backgroundColor: value,
                        borderColor: "var(--border-color-neutral-dimmed-darker)"
                    }}
                />
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
