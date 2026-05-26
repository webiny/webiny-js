import React from "react";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { StyleAccordion } from "../StyleAccordion.js";
import { Visibility, type VisibilityProps } from "./Visibility/index.js";

export const VisibilityGroup = ({ elementId }: VisibilityProps) => {
    return (
        <StyleAccordion.Item title={"Visibility"} icon={<VisibilityIcon />}>
            <Visibility elementId={elementId} />
        </StyleAccordion.Item>
    );
};
