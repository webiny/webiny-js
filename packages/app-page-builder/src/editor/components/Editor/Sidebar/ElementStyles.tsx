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
            {elementSettings &&
                elementSettings
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
    );
};

export default React.memo(ElementStyles);
