import React from "react";
import { useFontColorPicker, DropDown } from "@webiny/lexical-editor";
import { LexicalColorPicker } from "~/components/LexicalColorPicker/LexicalColorPicker";

export const LexicalColorPickerDropdown = () => {
    const { value, applyColor } = useFontColorPicker();

    return (
        <DropDown
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel={"Formatting options for text color"}
            buttonIconClassName="icon font-color"
            stopCloseOnClickSelf={true}
            disabled={false}
            showScroll={false}
        >
            <LexicalColorPicker value={value} onChangeComplete={applyColor} />
        </DropDown>
    );
};
