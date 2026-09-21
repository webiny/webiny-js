import React from "react";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { AdminConfig } from "~/config/AdminConfig.js";
import { useOpenDialog } from "~/hooks/useOpenDialog.js";
import { ASSUMED_ROLE_DIALOG } from "./AssumedRoleDialog.js";

const { Menu } = AdminConfig;

export const AssumedRoleMenuItem = () => {
    const { openDialog } = useOpenDialog();

    return (
        <Menu.User.Item
            icon={<Menu.User.Item.Icon element={<VisibilityIcon />} label={"View as"} />}
            text={"View as..."}
            onClick={() => openDialog(ASSUMED_ROLE_DIALOG, {})}
        />
    );
};
