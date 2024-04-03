import React from "react";
import { Sidebar } from "~/editor/config/Sidebar/Sidebar";
import { ScrollableContainer } from "~/editor/defaultConfig/Sidebar/ScrollableContainer";

export const StyleSettingsGroup = () => {
    return (
        <ScrollableContainer>
            <Sidebar.Group.Tab label={"Style"} element={<Sidebar.Elements group={"style"} />} />
        </ScrollableContainer>
    );
};
