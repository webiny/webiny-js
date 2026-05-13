import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as NotesIcon } from "@webiny/icons/notes.svg";
import { Sidebar } from "~/BaseEditor/config/Sidebar/Sidebar.js";
import { ScrollableContainer } from "~/BaseEditor/config/Sidebar/ScrollableContainer.js";

export const ElementSettingsGroup = () => (
    <ScrollableContainer tabIndex={-1}>
        <Sidebar.Group.Tab
            name={"element"}
            label={"Element"}
            icon={<Icon icon={<NotesIcon />} label={"Element"} />}
            element={<Sidebar.Elements group={"element"} />}
        />
    </ScrollableContainer>
);
