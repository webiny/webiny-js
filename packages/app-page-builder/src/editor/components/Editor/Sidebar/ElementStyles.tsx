import React from "react";
import styled from "@emotion/styled";

import useElementSettings from "../../../plugins/elementSettings/bar/useElementSettings";

const SidebarActionsWrapper = styled("div")({
    display: "flex",
    flexWrap: "wrap"
});

const ElementStyles = () => {
    const elementSettings = useElementSettings();
    return (
        <SidebarActionsWrapper>
            {elementSettings.map(({ plugin, options }, index) => {
                return (
                    <div key={plugin.name + "-" + index}>
                        {typeof plugin.render === "function" && plugin.render({ options })}
                    </div>
                );
            })}
        </SidebarActionsWrapper>
    );
};

export default React.memo(ElementStyles);
