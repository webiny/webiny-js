import React, { useCallback, useEffect } from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import store from "store";
import { makeDecoratable } from "@webiny/app-admin";
import { Elevation } from "@webiny/ui/Elevation";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import {
    highlightSidebarTabMutation,
    updateSidebarActiveTabIndexMutation
} from "~/editor/recoil/modules";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useElementSidebar } from "~/editor/hooks/useElementSidebar";
import { Sidebar } from "./Sidebar";

const LOCAL_STORAGE_KEY = "webiny_pb_editor_active_tab";

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

export const TabContainer = styled("div")({
    display: "flex",
    flexDirection: "column",
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

export const Layout = makeDecoratable("SidebarLayout", () => {
    const [element] = useActiveElement();
    const [sidebar, setSidebar] = useElementSidebar();

    const activeTabIndex = store.get(LOCAL_STORAGE_KEY, sidebar.activeTabIndex) ?? 0;

    const setActiveTabIndex = useCallback(
        index => {
            setSidebar(prev => updateSidebarActiveTabIndexMutation(prev, index));
            if (element) {
                store.set(LOCAL_STORAGE_KEY, index);
            }
        },
        [element]
    );

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
            <Tabs value={activeTabIndex} onActivate={setActiveTabIndex}>
                <Tab label={"Style"}>
                    <TabContainer>
                        <Sidebar.Elements group={"style"} />
                    </TabContainer>
                </Tab>
                <Tab label={"Element"} disabled={!element}>
                    <TabContainer>
                        <Sidebar.Elements group={"element"} />
                    </TabContainer>
                </Tab>
            </Tabs>
            {sidebar.highlightTab && <PanelHighLight />}
        </Elevation>
    );
});
