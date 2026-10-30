import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as SelectAllIcon } from "@webiny/icons/select_all.svg";
import { Sidebar } from "~/BaseEditor/config/Sidebar/Sidebar.js";

export const StyleSettingsGroup = () => {
    return (
        <Sidebar.Group.Tab
            name={"style"}
            label={"Style"}
            icon={<Icon icon={<SelectAllIcon />} label={"Style"} />}
            element={<Sidebar.Elements group={"style"} />}
        />
    );
};
