import {makeComposable} from "@webiny/react-composition";
import {DropDown} from "~/ui/DropDown";
import React from "react";


interface ColorPickerElement {
    onChange: (color: string) => void;
}

interface ColorPickerDropdown {
    onChange: (color: string) => void;
    value: string;
    ColorPickerElement?: React.ElementType<ColorPickerElement>;
}

export const ColorPickerDropdown = makeComposable(
    "FontColorPicker",
    ({ value, onChange, ColorPickerElement }: ColorPickerDropdown): JSX.Element => {
        return (
            <DropDown
                buttonClassName="toolbar-item font-color"
                buttonLabel={"value"}
                buttonAriaLabel={"Formatting options for font size"}
            >
                <div className="color-picker-wrapper" style={{ width: "auto" }}>
                    {ColorPickerElement &&  <ColorPickerElement onChange={onChange} />}
                    {value}
                </div>
            </DropDown>
        );
    }
);


