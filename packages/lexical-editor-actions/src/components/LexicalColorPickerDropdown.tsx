import React from "react";
import { useFontColorPicker, DropDown } from "@webiny/lexical-editor";
import { LexicalColorPicker } from "~/components/LexicalColorPicker/LexicalColorPicker";
import { css } from "emotion";

export const LexicalColorPickerDropdown = () => {
    const { value, applyColor } = useFontColorPicker();

    const buttonColorSelection = css({
        borderBottom: "3px solid " + value
    });

    return (
        <DropDown
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel={"Formatting options for text color"}
            buttonIconClassName={"icon font-color " + buttonColorSelection}
            stopCloseOnClickSelf={true}
            disabled={false}
            showScroll={false}
        >
            <LexicalColorPicker value={value} onChangeComplete={applyColor} />
        </DropDown>
    );
};
