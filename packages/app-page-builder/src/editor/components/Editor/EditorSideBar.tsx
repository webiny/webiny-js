import React, { useCallback } from "react";
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

    return (
        <Elevation z={1} className={rightSideBar}>
            <Tabs value={activeTabIndex} updateValue={setActiveTabIndex}>
                <Tab label={"style"}>
                    <StyleSettingsTabContent element={element} />
                </Tab>
                <Tab label={"element"} disabled={!element}>
                    <ElementSettingsTabContent
                        element={element}
                        highlightElementTab={uiAtomValue.highlightElementTab}
                        unHighlightElementTab={unHighlightElementTab}
                    />
                </Tab>
            </Tabs>
        </Elevation>
    );
};

export default React.memo(EditorSideBar);
