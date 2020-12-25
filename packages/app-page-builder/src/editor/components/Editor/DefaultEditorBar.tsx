import React from "react";
import { TopAppBar, TopAppBarSection } from "@webiny/ui/TopAppBar";
import { renderPlugins } from "@webiny/app/plugins";
import { css } from "emotion";

const topBar = css({
    boxShadow: "1px 0px 5px 0px rgba(128,128,128,1)"
});

const centerTopBar = css({
    "&.mdc-top-app-bar__section": {
        paddingTop: 0,
        paddingBottom: 0
    }
});

const DefaultEditorBar = () => {
    return (
        <TopAppBar className={topBar} fixed>
            <TopAppBarSection style={{ width: "33%" }} alignStart>
                {renderPlugins("pb-editor-default-bar-left")}
            </TopAppBarSection>
            <TopAppBarSection className={centerTopBar}>
                {renderPlugins("pb-editor-default-bar-center")}
            </TopAppBarSection>
            <TopAppBarSection style={{ width: "33%" }} alignEnd>
                {renderPlugins("pb-editor-default-bar-right")}
            </TopAppBarSection>
        </TopAppBar>
    );
};

export default React.memo(DefaultEditorBar);
