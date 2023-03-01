import React, { useEffect } from "react";
import { DropDown } from "@webiny/lexical-editor";
import { FontColorPicker } from "@webiny/lexical-editor/types";
import { makeComposable } from "@webiny/app-admin";

export const FontColorPickerDropdown = makeComposable<FontColorPicker>(
    "FontColorPickerDropdown",
    ({ value, onChange }): JSX.Element => {
        useEffect(() => {
            console.log("FontColorPickerDropdown");
        }, []);

        return (
            <DropDown
                buttonClassName="toolbar-item font-color"
                buttonLabel={"value"}
                buttonAriaLabel={"Formatting options for font size"}
            >
                <div className="color-picker-wrapper" style={{ width: "auto" }}>
                    {value && value}
                    {onChange && (
                        <div
                            style={{ width: 100, height: 30, backgroundColor: "#c1c1c1" }}
                            onClick={() => onChange("#0F52BA")}
                        >
                            Blue color
                        </div>
                    )}
                </div>
            </DropDown>
        );
    }
);
