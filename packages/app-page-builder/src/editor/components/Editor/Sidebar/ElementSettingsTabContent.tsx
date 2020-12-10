import React from "react";
import styled from "@emotion/styled";
import useElementSettings from "../../../plugins/elementSettings/bar/useElementSettings";
import AdvancedSettings from "../../../plugins/elementSettings/advanced/AdvancedSettings";

const RootElement = styled("div")({
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

const SidebarActionsWrapper = styled("div")({
    display: "flex",
    flexWrap: "wrap",
    borderBottom: "1px solid rgb(234,233,234)"
});

const ElementSettingsTabContent = ({ element }) => {
    const elementSettings = useElementSettings();

    if (!element) {
        return null;
    }

    return (
        <RootElement>
            <SidebarActionsWrapper>
                {elementSettings.map(({ plugin, options }, index) => {
                    return (
                        <div key={plugin.name + "-" + index}>
                            {typeof plugin.renderAction === "function" &&
                                plugin.renderAction({ options })}
                        </div>
                    );
                })}
            </SidebarActionsWrapper>
            <AdvancedSettings />
        </RootElement>
    );
};

export default React.memo(ElementSettingsTabContent);
