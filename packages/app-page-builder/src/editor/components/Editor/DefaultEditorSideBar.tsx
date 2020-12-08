import React from "react";
import { Elevation } from "@webiny/ui/Elevation";
import { css } from "emotion";
import { Tabs, Tab } from "@webiny/ui/Tabs";

import NoActiveElement from "./Sidebar/NoActiveElement";
import SidebarActions from "./Sidebar/SidebarActions";
import ElementStyles from "./Sidebar/ElementStyles";

const rightSideBar = css({
    boxShadow: "1px 0px 5px 0px rgba(128,128,128,1)",
    position: "fixed",
    right: 0,
    top: 65,
    height: "100%",
    width: 300,
    zIndex: 1
});

const DefaultEditorSideBar = ({ shouldRenderSettings }) => {
    return (
        <Elevation z={1} className={rightSideBar}>
            <Tabs>
                <Tab label={"style"}>
                    {shouldRenderSettings ? <ElementStyles /> : <NoActiveElement />}
                </Tab>
                <Tab label={"Element"} disabled={!shouldRenderSettings}>
                    <SidebarActions />
                </Tab>
            </Tabs>
        </Elevation>
    );
};

export default React.memo(DefaultEditorSideBar);
