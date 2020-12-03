import React from "react";
import styled from "@emotion/styled";
import useElementSettings from "../../../plugins/elementSettings/bar/useElementSettings";

const SidebarActionsWrapper = styled("div")({
    display: "flex",
    flexWrap: "wrap"
});

const SidebarActions = () => {
    const elementSettings = useElementSettings();
    return (
        <React.Fragment>
            <SidebarActionsWrapper>
                {elementSettings
                    // FIXME: Remove this after element settings cleanup.
                    .filter(
                        ({ plugin }) =>
                            plugin.name.includes("delete") || plugin.name.includes("clone")
                    )
                    .map(({ plugin, options }, index) => {
                        return (
                            <div key={plugin.name + "-" + index}>
                                {typeof plugin.renderAction === "function" &&
                                    plugin.renderAction({ options })}
                            </div>
                        );
                    })}
            </SidebarActionsWrapper>
            {elementSettings.map(({ plugin, options }, index) => {
                return (
                    <div key={plugin.name + "-" + index}>
                        {typeof plugin.renderElement === "function" &&
                            plugin.renderElement({ options })}
                    </div>
                );
            })}
        </React.Fragment>
    );
};

export default React.memo(SidebarActions);
