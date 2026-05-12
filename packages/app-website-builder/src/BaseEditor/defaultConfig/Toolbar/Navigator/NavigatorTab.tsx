import React from "react";
import { SegmentedControl, Icon } from "@webiny/admin-ui";
import { ReactComponent as TreeIcon } from "@webiny/icons/account_tree.svg";
import { Navigator } from "./Navigator.js";

export const NavigatorTab = () => (
    <SegmentedControl.Tabs.Tab
        value={"navigator"}
        trigger={"Navigator"}
        icon={<Icon icon={<TreeIcon />} label={"Navigator"} />}
        content={<Navigator />}
    />
);
