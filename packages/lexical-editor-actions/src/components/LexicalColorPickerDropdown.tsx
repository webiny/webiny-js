import React from "react";
import { useFontColorPicker, DropDown } from "@webiny/lexical-editor";
import { LexicalColorPicker } from "~/components/LexicalColorPicker/LexicalColorPicker";

import { css } from "emotion";
const selectedColor = css({
    ".icon.font-color": {
        borderBottom: "3px solid var(--selected-color)"
    }
});

export const LexicalColorPickerDropdown = () => {
    const { value, applyColor } = useFontColorPicker();

    return (
        <DropDown
            buttonClassName={"toolbar-item color-picker " + selectedColor}
            style={{ "--selected-color": value } as React.CSSProperties}
            buttonAriaLabel={"Formatting options for font size"}
            buttonIconClassName="icon font-color"
            stopCloseOnClickSelf={true}
            disabled={false}
            showScroll={false}
        >
            <LexicalColorPicker value={value} onChangeComplete={applyColor} />
        </DropDown>
    );
};
