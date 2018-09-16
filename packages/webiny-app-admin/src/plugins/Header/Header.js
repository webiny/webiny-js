// @flow
import React from "react";
import { getPlugins } from "webiny-app/plugins";
import { TopAppBarPrimary, TopAppBarSection } from "webiny-ui/TopAppBar";
import { css } from "emotion";

const middleBar = css({
    width: "50%"
});

const edgeBars = css({
    width: "25%"
});

const renderPlugins = type => {
    return getPlugins(type).map(plugin => {
        const element = plugin.render();
        return element && React.cloneElement(element, { key: plugin.name });
    });
};

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
