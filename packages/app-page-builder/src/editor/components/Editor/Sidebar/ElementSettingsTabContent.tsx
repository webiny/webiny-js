import React from "react";
import styled from "@emotion/styled";
import useElementSettings from "../../../plugins/elementSettings/hooks/useElementSettings";
import AdvancedSettings from "../../../plugins/elementSettings/advanced/AdvancedSettings";
import { PbEditorElement } from "../../../../types";
import { COLORS } from "../../../plugins/elementSettings/components/StyledComponents";
import NoActiveElement from "./NoActiveElement";
import { ReactComponent as TouchIcon } from "./icons/touch_app.svg";

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

interface ElementSettingsTabContentProps {
    element: PbEditorElement;
}
const ElementSettingsTabContent: React.FC<ElementSettingsTabContentProps> = ({ element }) => {
    const elementSettings = useElementSettings();

    if (!element) {
        return (
            <NoActiveElement
                icon={<TouchIcon />}
                message={"Select an element on the canvas to activate this panel."}
            />
        );
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
