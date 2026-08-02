import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as NotesIcon } from "@webiny/icons/notes.svg";
import { Sidebar } from "~/BaseEditor/config/Sidebar/Sidebar.js";

export const ElementSettingsGroup = () => (
    <Sidebar.Group.Tab
        name={"element"}
        label={"Element"}
        icon={<Icon icon={<NotesIcon />} label={"Element"} />}
        element={<Sidebar.Elements group={"element"} />}
    />
);
