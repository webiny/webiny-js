import React from "react";
import { SegmentedControl, Icon } from "@webiny/admin-ui";
import { ReactComponent as InsertIcon } from "@webiny/icons/add_circle_outline.svg";
import { InsertElements } from "./InsertElements.js";

export const InsertElementsTab = () => (
    <SegmentedControl.Tabs.Tab
        value={"insert"}
        trigger={"Insert"}
        icon={<Icon icon={<InsertIcon />} label={"Insert Element"} />}
        content={<InsertElements />}
    />
);
