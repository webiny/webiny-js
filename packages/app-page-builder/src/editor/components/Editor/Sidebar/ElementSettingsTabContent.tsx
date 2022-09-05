import React from "react";
import styled from "@emotion/styled";
import NoActiveElement from "./NoActiveElement";
import { ReactComponent as TouchIcon } from "./icons/touch_app.svg";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { COLORS } from "~/editor/plugins/elementSettings/components/StyledComponents";
import useElementSettings from "~/editor/plugins/elementSettings/hooks/useElementSettings";
import { ElementSettings } from "~/editor/plugins/elementSettings/advanced/ElementSettings";

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

const ElementSettingsTabContent: React.FC = () => {
    const [element] = useActiveElement();
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
            <ElementSettings />
        </RootElement>
    );
};

export default React.memo(ElementSettingsTabContent);
