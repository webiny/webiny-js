//@flow
import React from "react";
import { TopAppBar, TopAppBarSection } from "webiny-ui/TopAppBar";
import { Plugins } from "webiny-app/components";
import { css } from "emotion";

const alignCenter = css({
    justifyContent: "center",
    alignItems: "center",
    width: "calc(33% - 55px)",
    marginLeft: 55
});

const DefaultEditorBar = () => {
    return (
        <TopAppBar fixed>
            <TopAppBarSection style={{ width: "33%" }} alignStart>
                <Plugins type={"cms-default-bar-left"} />
            </TopAppBarSection>
            <TopAppBarSection className={alignCenter}>
                <Plugins type={"cms-default-bar-center"} />
            </TopAppBarSection>
            <TopAppBarSection style={{ width: "33%" }} alignEnd>
                <Plugins type={"cms-default-bar-right"} />
            </TopAppBarSection>
        </TopAppBar>
    );
};

export default DefaultEditorBar;
