//@flow
import React from "react";
import { pure } from "recompose";
import { TopAppBar, TopAppBarSection } from "webiny-ui/TopAppBar";
import { renderPlugins } from "webiny-app/plugins";
import { css } from "emotion";

/*
const alignCenter = css({
    justifyContent: "center",
    alignItems: "center",
    width: "calc(33% - 55px)",
    marginLeft: 55
});
*/

const topBar = css({
    boxShadow: "1px 0px 5px 0px rgba(128,128,128,1)"
});

const DefaultEditorBar = pure(() => {
    return (
        <TopAppBar className={topBar} fixed>
            <TopAppBarSection style={{ width: "50%" }} alignStart>
                {renderPlugins("cms-default-bar-left")}
            </TopAppBarSection>
            {/*
            <TopAppBarSection className={alignCenter}>
                {renderPlugins("cms-default-bar-center")}
            </TopAppBarSection>
            */}
            <TopAppBarSection style={{ width: "33%" }} alignEnd>
                {renderPlugins("cms-default-bar-right")}
            </TopAppBarSection>
        </TopAppBar>
    );
});

export default DefaultEditorBar;
