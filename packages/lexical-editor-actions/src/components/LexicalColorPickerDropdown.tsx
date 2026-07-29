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
                // The A icon plus a swatch box showing the current font color.
                <span className="flex items-center gap-[2px]">
                    <FontColorIcon className="icon" />
                    <span
                        className="size-4 rounded-[2px] border-2"
                        style={{
                            backgroundColor: value,
                            borderColor: "var(--border-color-neutral-dimmed-darker)"
                        }}
                    />
                </span>
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
