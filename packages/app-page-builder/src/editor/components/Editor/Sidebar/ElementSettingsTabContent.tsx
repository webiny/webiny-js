import React from "react";
import styled from "@emotion/styled";
import useElementSettings from "../../../plugins/elementSettings/hooks/useElementSettings";
import AdvancedSettings from "../../../plugins/elementSettings/advanced/AdvancedSettings";
import { PbElement } from "../../../../types";
import { COLORS } from "../../../plugins/elementSettings/components/StyledComponents";

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
    borderBottom: `1px solid ${COLORS.gray}`,
    backgroundColor: COLORS.lightGray,
    borderTop: `1px solid ${COLORS.gray}`,
    justifyContent: "center"
});

type ElementSettingsTabContentProps = {
    element: PbElement;
};
const ElementSettingsTabContent = ({ element }: ElementSettingsTabContentProps) => {
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
