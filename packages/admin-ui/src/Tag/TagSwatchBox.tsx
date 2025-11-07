import * as React from "react";
import { useTagProps } from "./TagPropsProvider.js";

export const TagSwatchBox = () => {
    const { swatchColor, swatchColorIcon } = useTagProps();

    if (!swatchColor || swatchColorIcon === false) {
        return null;
    }

    return (
        <div className={"mr-xs"}>
            <div className={"size-sm rounded-xs"} style={{ backgroundColor: swatchColor }} />
        </div>
    );
};
