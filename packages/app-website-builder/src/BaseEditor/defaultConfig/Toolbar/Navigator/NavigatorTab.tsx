import React from "react";
import { Tabs, Icon } from "@webiny/admin-ui";
import { ReactComponent as TreeIcon } from "@webiny/icons/account_tree.svg";
import { Navigator } from "./Navigator.js";

export const NavigatorTab = () => (
    <Tabs.Tab
        value={"navigator"}
        trigger={"Navigator"}
        icon={<Icon icon={<TreeIcon />} label={"Navigator"} />}
        content={<Navigator />}
    />
);
