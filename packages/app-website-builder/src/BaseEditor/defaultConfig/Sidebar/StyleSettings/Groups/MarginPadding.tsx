import React from "react";
import { Accordion } from "@webiny/admin-ui";
import { MarginPaddingControl } from "./MarginPadding/MarginPadding";

interface MarginPaddingProps {
    elementId: string;
}

export const MarginPadding = ({ elementId }: MarginPaddingProps) => {
    return (
        <Accordion.Item
            title={"Margin & Padding"}
            description={"Set spacing in and around the element"}
        >
            <div style={{ width: 280, marginLeft: -8 }}>
                <MarginPaddingControl elementId={elementId} />
            </div>
        </Accordion.Item>
    );
};
