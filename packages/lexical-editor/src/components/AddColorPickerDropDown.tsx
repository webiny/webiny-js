import React from "react";

interface AddColorPickerDropDown {
    target: "font-color-action" | string;
    element: JSX.Element;
}

export const AddColorPickerDropDown: React.FC<AddColorPickerDropDown> = ({ target, element }): JSX.Element => {
    return <div></div>;
};
