import React from "react";
import styled from "react-emotion";
import { getPlugins } from "webiny-app/plugins";

const PluginViewsContainer = styled("div")({
    position: "absolute",
    left: 0,
    top: 64,
    zIndex: 3
});

const PluginViews = () => {
    const actions = getPlugins("cms-toolbar");

    return (
        <PluginViewsContainer data-type={"plugin-views-top"}>
            <div style={{ position: "relative" }}>
                {actions.map(plugin =>
                    React.cloneElement(plugin.renderView(), { key: plugin.name })
                )}
            </div>
        </PluginViewsContainer>
    );
};

export default PluginViews;
