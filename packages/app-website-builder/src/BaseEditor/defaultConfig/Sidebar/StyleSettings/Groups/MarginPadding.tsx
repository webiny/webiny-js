import React from "react";
import { Accordion } from "@webiny/admin-ui";
import { MarginPaddingControl } from "./MarginPadding/MarginPadding";

interface MarginPaddingProps {
    elementId: string;
}

export const MarginPadding = ({ elementId }: MarginPaddingProps) => {
    return (
        <Accordion.Item title={"Margin & Padding"}>
            <div style={{ width: 280, marginLeft: -8 }}>
                <MarginPaddingControl elementId={elementId} />
            </div>
        </Accordion.Item>
    );
};
