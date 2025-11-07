import * as React from "react";
import { useAlertProps } from "./AlertPropsProvider.js";

export const AlertSwatchBox = () => {
    const { swatchColor, swatchColorIcon } = useAlertProps();

    if (!swatchColor || swatchColorIcon === false) {
        return null;
    }

    return (
        <div className={"h-lg flex items-center"}>
            <div className={"size-md rounded-xs"} style={{ backgroundColor: swatchColor }} />
        </div>
    );
};
