import React, { useEffect } from "react";
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

const PanelHighLight = styled("div")({
    "&": {
        opacity: 0,
        animation: "wf-blink-in 1s",
        border: "2px solid var(--mdc-theme-secondary)",
        boxShadow: "0 0 15px var(--mdc-theme-secondary)",
        backgroundColor: "rgba(42, 217, 134, 0.25)",
        borderRadius: "2px",
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",
        zIndex: 1,
        pointerEvents: "none"
    },
    "@keyframes wf-blink-in": { "40%": { opacity: 1 } }
});

type ElementSettingsTabContentProps = {
    element: PbElement;
    highlightElementTab: boolean;
    unHighlightElementTab: Function;
};

const ElementSettingsTabContent = ({
    element,
    highlightElementTab,
    unHighlightElementTab
}: ElementSettingsTabContentProps) => {
    const elementSettings = useElementSettings();

    useEffect(() => {
        if (highlightElementTab) {
            setTimeout(unHighlightElementTab, 1000);
        }
    }, [highlightElementTab]);

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
            {highlightElementTab && <PanelHighLight />}
        </RootElement>
    );
};

export default React.memo(ElementSettingsTabContent);
