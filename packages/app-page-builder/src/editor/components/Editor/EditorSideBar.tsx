import React, { useCallback, useEffect } from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { useRecoilValue, useRecoilState } from "recoil";
import { Elevation } from "@webiny/ui/Elevation";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import {
    activeElementWithChildrenSelector,
    highlightElementTabMutation,
    sidebarActiveTabIndexSelector,
    uiAtom,
    updateSidebarActiveTabIndexMutation
} from "../../recoil/modules";
import StyleSettingsTabContent from "./Sidebar/StyleSettingsTabContent";
import ElementSettingsTabContent from "./Sidebar/ElementSettingsTabContent";

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

const EditorSideBar = () => {
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const activeTabIndex = useRecoilValue(sidebarActiveTabIndexSelector);
    const [uiAtomValue, setUiAtomValue] = useRecoilState(uiAtom);

    const setActiveTabIndex = useCallback(index => {
        setUiAtomValue(prev => updateSidebarActiveTabIndexMutation(prev, index));
    }, []);

    const unHighlightElementTab = useCallback(() => {
        setUiAtomValue(prev => highlightElementTabMutation(prev, false));
    }, []);

    useEffect(() => {
        if (uiAtomValue.highlightElementTab) {
            setTimeout(unHighlightElementTab, 1000);
        }
    }, [uiAtomValue.highlightElementTab]);

    return (
        <Elevation z={1} className={rightSideBar}>
            <Tabs value={activeTabIndex} updateValue={setActiveTabIndex}>
                <Tab label={"style"}>
                    <StyleSettingsTabContent
                        element={element}
                        displayMode={uiAtomValue.displayMode}
                    />
                </Tab>
                <Tab label={"element"} disabled={!element}>
                    <ElementSettingsTabContent element={element} />
                </Tab>
            </Tabs>
            {uiAtomValue.highlightElementTab && <PanelHighLight />}
        </Elevation>
    );
};

export default React.memo(EditorSideBar);
