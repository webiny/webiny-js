import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as TreeIcon } from "@webiny/icons/account_tree.svg";
import { Toolbar } from "~/BaseEditor/config/Toolbar/Toolbar.js";
import { Navigator } from "./Navigator.js";

export const NavigatorTab = () => (
    <Toolbar.Tab
        name={"navigator"}
        label={"Navigator"}
        icon={<Icon icon={<TreeIcon />} label={"Navigator"} />}
        element={<Navigator />}
    />
);
