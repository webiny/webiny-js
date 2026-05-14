import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as SelectAllIcon } from "@webiny/icons/select_all.svg";
import { Sidebar } from "~/BaseEditor/config/Sidebar/Sidebar.js";
import { ScrollableContainer } from "~/BaseEditor/config/Sidebar/ScrollableContainer.js";

export const StyleSettingsGroup = () => {
    return (
        <ScrollableContainer tabIndex={-1}>
            <Sidebar.Group.Tab
                name={"style"}
                label={"Style"}
                icon={<Icon icon={<SelectAllIcon />} label={"Style"} />}
                element={<Sidebar.Elements group={"style"} />}
            />
        </ScrollableContainer>
    );
};
