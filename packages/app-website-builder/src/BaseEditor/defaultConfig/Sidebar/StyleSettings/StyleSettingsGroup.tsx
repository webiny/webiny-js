import React from "react";
import { Sidebar } from "~/BaseEditor/config/Sidebar/Sidebar";
import { ScrollableContainer } from "~/BaseEditor/config/Sidebar/ScrollableContainer";
import { useActiveElement } from "~/BaseEditor/hooks/useActiveElement";

export const StyleSettingsGroup = () => {
    const [element] = useActiveElement();

    return (
        <ScrollableContainer tabIndex={-1}>
            <Sidebar.Group.Tab
                name={"style"}
                label={"Style"}
                element={<Sidebar.Elements group={"style"} />}
                noPadding={element ? true : false}
            />
        </ScrollableContainer>
    );
};
