import React from "react";
import { Sidebar } from "~/editor/config/Sidebar/Sidebar";

export const StyleSettingsGroup = () => {
    return <Sidebar.Group.Tab label={"Style"} element={<Sidebar.Elements group={"style"} />} />;
};
