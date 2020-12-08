import React from "react";
import styled from "@emotion/styled";

import useElementSettings from "../../../plugins/elementSettings/bar/useElementSettings";

const SidebarActionsWrapper = styled("div")({
    display: "flex",
    flexWrap: "wrap",
    height: "calc(100vh - 65px - 48px)", // Subtract top-bar and tab-header height
    overflowY: "auto",
    // Style scrollbar
    "&::-webkit-scrollbar": {
        width: 1
    },
    "&::-webkit-scrollbar-track": {
        boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.3)"
    },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: "darkgrey",
        outline: "1px solid slategrey"
    }
});

const ElementStyles = () => {
    const elementSettings = useElementSettings();
    return (
        <SidebarActionsWrapper>
            {elementSettings.map(({ plugin, options }, index) => {
                return (
                    <div key={plugin.name + "-" + index} style={{ width: "100%" }}>
                        {typeof plugin.render === "function" && plugin.render({ options })}
                    </div>
                );
            })}
        </SidebarActionsWrapper>
    );
};

export default React.memo(ElementStyles);
