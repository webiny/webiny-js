//@flow
import React from "react";
import { TopAppBar, TopAppBarSection } from "webiny-ui/TopAppBar";
import { getPlugins } from "webiny-app/plugins";
import { css } from "emotion";

const renderPlugins = type => {
    return getPlugins(type).map(plugin => {
        return React.cloneElement(plugin.render(), { key: plugin.name });
    });
};

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
                {renderPlugins("default-bar-left")}
            </TopAppBarSection>
            <TopAppBarSection className={alignCenter}>
                {renderPlugins("default-bar-center")}
            </TopAppBarSection>
            <TopAppBarSection style={{ width: "33%" }} alignEnd>
                {renderPlugins("default-bar-right")}
            </TopAppBarSection>
        </TopAppBar>
    );
};

export default DefaultEditorBar;
