// @flow
import React from "react";
import { get } from "dot-prop-immutable";
import { connect } from "@webiny/app-page-builder/editor/redux";
import styled from "react-emotion";
import { css } from "emotion";
import { getPlugins } from "@webiny/plugins";
import { withPageBuilder } from "@webiny/app-page-builder/context";
import { getContent, isPluginActive, getPage } from "@webiny/app-page-builder/editor/selectors";
import Element from "@webiny/app-page-builder/editor/components/Element";
import { Elevation } from "@webiny/ui/Elevation";

const ContentContainer = styled("div")(({ theme }) => ({
    backgroundColor: get(theme, "colors.background"),
    ".webiny-pb-page-document": {
        overflowY: "visible", // cuts off the block selector tooltip
        overflowX: "visible"
    }
}));

const contentContainerWrapper = css({
    margin: "95px 65px 50px 85px",
    padding: 0,
    position: "absolute",
    width: "calc(100vw - 115px)",
    //overflow: "hidden", // cuts off the block selector tooltip
    top: 0,
    boxSizing: "border-box",
    zIndex: 1
});

const BaseContainer = styled("div")({
    width: "100%",
    left: 52,
    margin: "0 auto"
});

const Content = ({ rootElement, pageBuilder: { theme }, renderLayout, layout }) => {
    const plugins = getPlugins("pb-editor-content");
    const themeLayout = theme.layouts.find(l => l.name === layout);

    if (renderLayout && !themeLayout) {
        return `Layout "${layout}" was not found in your theme!`;
    }

    let content = <Element id={rootElement.id} />;

    content = renderLayout ? React.createElement(themeLayout.component, null, content) : content;

    return (
        <Elevation className={contentContainerWrapper} z={2}>
            <ContentContainer theme={theme}>
                {plugins.map(plugin => React.cloneElement(plugin.render(), { key: plugin.name }))}
                <BaseContainer className={"webiny-pb-editor-content-preview"}>
                    {content}
                </BaseContainer>
            </ContentContainer>
        </Elevation>
    );
};

const stateToProps = state => ({
    rootElement: state.elements[getContent(state).id],
    layout: get(getPage(state), "settings.general.layout"),
    renderLayout: isPluginActive("pb-editor-toolbar-preview")(state)
});

export default connect(stateToProps)(withPageBuilder()(Content));
