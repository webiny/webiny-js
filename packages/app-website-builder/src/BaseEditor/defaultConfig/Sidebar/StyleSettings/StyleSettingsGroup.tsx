import React from "react";
import { Sidebar } from "~/BaseEditor/config/Sidebar/Sidebar.js";
import { ScrollableContainer } from "~/BaseEditor/config/Sidebar/ScrollableContainer.js";
import { useActiveElement } from "~/BaseEditor/hooks/useActiveElement.js";

export const StyleSettingsGroup = () => {
    const [element] = useActiveElement();

    return (
        <ScrollableContainer tabIndex={-1}>
            <Sidebar.Group.Tab
                name={"style"}
                label={"Style"}
                element={<Sidebar.Elements group={"style"} />}
                noPadding={!!element}
            />
        </ScrollableContainer>
    );
};
