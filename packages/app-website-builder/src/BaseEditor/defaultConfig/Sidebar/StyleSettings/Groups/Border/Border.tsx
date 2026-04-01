import React from "react";
import { BorderWidth } from "./BorderWidth.js";
import { BorderRadius } from "./BorderRadius.js";
import { BorderStyle } from "./BorderStyle.js";
import { BorderColor } from "./BorderColor.js";

export const BorderControl = ({ elementId }: { elementId: string }) => {
    return (
        <div className="flex flex-col gap-sm w-full">
            <BorderWidth elementId={elementId} />
            <BorderRadius elementId={elementId} />
            <BorderStyle elementId={elementId} />
            <BorderColor elementId={elementId} />
        </div>
    );
};
