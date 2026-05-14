import React from "react";
import { ReactComponent as BorderIcon } from "@webiny/icons/border_all.svg";
import { StyleAccordion } from "../StyleAccordion.js";
import { BorderControl } from "./Border/Border.js";

interface BorderProps {
    elementId: string;
}

export const Border = ({ elementId }: BorderProps) => {
    return (
        <StyleAccordion.Item title={"Border"} icon={<BorderIcon />}>
            <div style={{ width: 280, marginLeft: -8 }}>
                <BorderControl elementId={elementId} />
            </div>
        </StyleAccordion.Item>
    );
};
