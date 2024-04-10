import React, { useCallback, useEffect } from "react";
import styled from "@emotion/styled";
import { highlightSidebarTabMutation } from "~/editor/recoil/modules";
import { useElementSidebar } from "~/editor/hooks/useElementSidebar";

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

export const SidebarHighlight = () => {
    const [sidebar, setSidebar] = useElementSidebar();

    const unhighlightElementTab = useCallback(() => {
        setSidebar(prev => highlightSidebarTabMutation(prev, false));
    }, []);

    useEffect(() => {
        if (sidebar.highlightTab) {
            setTimeout(unhighlightElementTab, 1000);
        }
    }, [sidebar.highlightTab]);

    return sidebar.highlightTab ? <PanelHighLight /> : null;
};
