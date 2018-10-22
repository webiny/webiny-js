//@flow
import React from "react";
import { TopAppBar, TopAppBarSection } from "webiny-ui/TopAppBar";
import { renderPlugins } from "webiny-app/plugins";
import { css } from "emotion";

const alignCenter = css({
    justifyContent: "center",
    alignItems: "center",
    width: 'calc(33% - 55px)',
    marginLeft: 55
});

const DefaultEditorBar = () => {
    return (
        <TopAppBar fixed>
            <TopAppBarSection style={{ width: "33%" }} alignStart>
                {renderPlugins("cms-default-bar-left")}
            </TopAppBarSection>
            <TopAppBarSection className={alignCenter}>
                {renderPlugins("cms-default-bar-center")}
            </TopAppBarSection>
            <TopAppBarSection style={{ width: "33%" }} alignEnd>
                {renderPlugins("cms-default-bar-right")}
            </TopAppBarSection>
        </TopAppBar>
    );
};

export default DefaultEditorBar;
