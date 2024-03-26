import React from "react";
import { Sidebar } from "~/editor/config/Sidebar/Sidebar";
import { useActiveElement } from "~/editor/hooks/useActiveElement";

export const ElementSettingsGroup = () => {
    const [element] = useActiveElement();

    return (
        <Sidebar.Group.Tab
            label={"Element"}
            element={<Sidebar.Elements group={"element"} />}
            disabled={!element}
        />
    );
};
