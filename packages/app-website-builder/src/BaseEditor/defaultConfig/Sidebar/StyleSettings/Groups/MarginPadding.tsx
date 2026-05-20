import React from "react";
import { ReactComponent as MarginPaddingIcon } from "@webiny/icons/border_inner.svg";
import { StyleAccordion } from "../StyleAccordion.js";
import { MarginPaddingControl } from "./MarginPadding/MarginPadding.js";

interface MarginPaddingProps {
    elementId: string;
}

export const MarginPadding = ({ elementId }: MarginPaddingProps) => {
    return (
        <StyleAccordion.Item title={"Margin & Padding"} icon={<MarginPaddingIcon />}>
            <div style={{ width: 280, marginLeft: -8 }}>
                <MarginPaddingControl elementId={elementId} />
            </div>
        </StyleAccordion.Item>
    );
};
