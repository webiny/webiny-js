import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as InsertIcon } from "@webiny/icons/add_circle_outline.svg";
import { Toolbar } from "~/BaseEditor/config/Toolbar/Toolbar.js";
import { InsertElements } from "./InsertElements.js";
1;
export const InsertElementsTab = () => (
    <Toolbar.Tab
        name={"insert"}
        label={"Insert"}
        icon={<Icon icon={<InsertIcon />} label={"Insert Element"} />}
        element={<InsertElements />}
    />
);
