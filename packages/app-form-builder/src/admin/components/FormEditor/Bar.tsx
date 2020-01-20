import React from "react";
import { TopAppBar, TopAppBarSection } from "@webiny/ui/TopAppBar";
import { renderPlugins } from "@webiny/app/plugins";

import { css } from "emotion";

const topBar = css({
    boxShadow: "1px 0px 5px 0px rgba(128,128,128,1)"
});

export default function Bar() {
    return (
        <TopAppBar className={topBar} fixed>
            <TopAppBarSection style={{ width: "50%" }} alignEnd>
                {renderPlugins("form-editor-default-bar-left")}
            </TopAppBarSection>

            <TopAppBarSection style={{ width: "50%" }} alignEnd>
                {renderPlugins("form-editor-default-bar-right")}
            </TopAppBarSection>
        </TopAppBar>
    );
}
