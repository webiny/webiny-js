import React from "react";
import { ToolbarActionDialog, useFontColorPicker } from "@webiny/lexical-editor";
import { LexicalColorPicker } from "./LexicalColorPicker/LexicalColorPicker";

export const LexicalColorPickerDropdown = () => {
    const { value, applyColor } = useFontColorPicker();

    return (
        <ToolbarActionDialog
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel={"Formatting options for font size"}
            buttonIconClassName="icon font-color"
            stopCloseOnClickSelf={true}
            disabled={false}
        >
            <div
                className="color-picker-wrapper"
                style={{ width: 240, height: 200, backgroundColor: "#000" }}
            >
                <LexicalColorPicker
                    value={value}
                    onChangeComplete={applyColor}
                    onChange={applyColor}
                />
            </div>
        </ToolbarActionDialog>
    );
};
