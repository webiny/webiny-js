import React from "react";
import styled from "@emotion/styled";
import { COLORS } from "~/editor/plugins/elementSettings/components/StyledComponents";
import { useElementSettings } from "~/editor/plugins/elementSettings/hooks/useElementSettings";
import { OnActiveElement } from "~/editor/defaultConfig/Sidebar/OnActiveElement";

const SidebarActions = styled("div")({
    display: "flex",
    flexWrap: "wrap",
    borderBottom: `1px solid ${COLORS.gray}`,
    backgroundColor: COLORS.lightGray,
    borderTop: `1px solid ${COLORS.gray}`,
    justifyContent: "center"
});

export const ElementActions = () => {
    const elementSettings = useElementSettings();

    return (
        <OnActiveElement>
            <SidebarActions>
                {elementSettings.map(({ plugin, options }, index) => {
                    return (
                        <div key={plugin.name + "-" + index}>
                            {typeof plugin.renderAction === "function" &&
                                plugin.renderAction({ options })}
                        </div>
                    );
                })}
            </SidebarActions>
        </OnActiveElement>
    );
};
