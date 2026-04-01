import React from "react";
import { Accordion } from "@webiny/admin-ui";
import { BorderControl } from "./Border/Border.js";

interface BorderProps {
    elementId: string;
}

export const Border = ({ elementId }: BorderProps) => {
    return (
        <Accordion.Item title={"Border"} description={"Set border width, radius, style, and color"}>
            <div style={{ width: 280, marginLeft: -8 }}>
                <BorderControl elementId={elementId} />
            </div>
        </Accordion.Item>
    );
};
