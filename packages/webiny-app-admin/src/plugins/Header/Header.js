// @flow
import React from "react";
import { Plugins } from "webiny-app/components";
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
                <Plugins type={"header-left"} />
            </TopAppBarSection>
            <TopAppBarSection className={middleBar}>
                <Plugins type={"header-middle"} />
            </TopAppBarSection>
            <TopAppBarSection className={edgeBars} alignEnd>
                <Plugins type={"header-right"} />
            </TopAppBarSection>
        </TopAppBarPrimary>
    );
};

export default Header;
