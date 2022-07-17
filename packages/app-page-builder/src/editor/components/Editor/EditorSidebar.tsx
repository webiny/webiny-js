import React, { useCallback, useEffect } from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { makeComposable } from "@webiny/app-admin";
import { Elevation } from "@webiny/ui/Elevation";
import { Tabs, Tab, TabProps } from "@webiny/ui/Tabs";
import {
    highlightSidebarTabMutation,
    updateSidebarActiveTabIndexMutation
} from "~/editor/recoil/modules";
import StyleSettingsTabContent from "./Sidebar/StyleSettingsTabContent";
import ElementSettingsTabContent from "./Sidebar/ElementSettingsTabContent";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useElementSidebar } from "~/editor/hooks/useElementSidebar";

const rightSideBar = css({
    boxShadow: "1px 0px 5px 0px rgba(128,128,128,1)",
    position: "fixed",
    right: 0,
    top: 65,
    height: "100%",
    width: 300,
    zIndex: 1
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

export const EditorSidebar: React.FC = React.memo(() => {
    const [element] = useActiveElement();
    const [sidebar, setSidebar] = useElementSidebar();

    const setActiveTabIndex = useCallback(index => {
        setSidebar(prev => updateSidebarActiveTabIndexMutation(prev, index));
    }, []);

    const unhighlightElementTab = useCallback(() => {
        setSidebar(prev => highlightSidebarTabMutation(prev, false));
    }, []);

    useEffect(() => {
        if (sidebar.highlightTab) {
            setTimeout(unhighlightElementTab, 1000);
        }
    }, [sidebar.highlightTab]);

    return (
        <Elevation z={1} className={rightSideBar}>
            <Tabs value={sidebar.activeTabIndex} updateValue={setActiveTabIndex}>
                <EditorSidebarTab label={"Style"}>
                    <StyleSettingsTabContent />
                </EditorSidebarTab>
                <EditorSidebarTab label={"Element"} disabled={!element}>
                    <ElementSettingsTabContent />
                </EditorSidebarTab>
            </Tabs>
            {sidebar.highlightTab && <PanelHighLight />}
        </Elevation>
    );
});

EditorSidebar.displayName = "EditorSidebar";

export type EditorSidebarTabProps = TabProps;

export const EditorSidebarTab = makeComposable<EditorSidebarTabProps>(
    "EditorSidebarTab",
    ({ children, ...props }) => {
        return <Tab {...props}>{children}</Tab>;
    }
);
