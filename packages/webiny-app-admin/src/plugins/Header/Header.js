// @flow
import React from "react";
import { renderPlugins } from "webiny-app/plugins";
import { TopAppBarPrimary, TopAppBarSection } from "webiny-ui/TopAppBar";
import { css } from "emotion";

const middleBar = css({
    width: "50%"
});

const edgeBars = css({
    width: "25%"
});

const Header = () => {
    return (
        <TopAppBarPrimary fixed>
            <TopAppBarSection className={edgeBars} alignStart>
                {renderPlugins("header-left")}
            </TopAppBarSection>
            <TopAppBarSection className={middleBar}>
                {renderPlugins("header-middle")}
            </TopAppBarSection>
            <TopAppBarSection className={edgeBars} alignEnd>
                {renderPlugins("header-right")}
            </TopAppBarSection>
        </TopAppBarPrimary>
    );
};

export default Header;
