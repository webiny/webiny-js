import React from "react";

interface IconPickerMainUIComponent {
    icons: any[];
    open: boolean;
    value: any;
    onChange: (icon: any) => void;
    onFilter: (value: any) => void;
}

export const IconPickerMainUIComponent = (props: IconPickerMainUIComponent) => {
    console.log("IconPickerMainUIComponent props", props);
    return <>Input</>;
};
