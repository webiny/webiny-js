// @flow
import React from "react";
import { get } from "dot-prop-immutable";
import { connect } from "react-redux";
import styled from "react-emotion";
import { compose, pure } from "recompose";
import { getPlugins } from "webiny-plugins";
import { withTheme } from "webiny-app-cms/theme";
import { getContent, isPluginActive, getPage } from "webiny-app-cms/editor/selectors";
import Element from "webiny-app-cms/editor/components/Element";

const ContentContainer = styled("div")(({ theme }) => ({
    margin: "64px 0px 0 54px",
    padding: "25px 10px 10px 10px",
    position: "absolute",
    width: "calc(100vw - 54px)",
    height: "calc(100vh - 64px)",
    overflow: "scroll",
    top: 0,
    boxShadow: "inset 1px 0px 5px 0px rgba(128, 128, 128, 1)",
    boxSizing: "border-box",
    zIndex: 1,
    backgroundColor: get(theme, "colors.background")
}));

const BaseContainer = styled("div")({
    width: "100%",
    left: 52,
    margin: "0 auto"
});

const Content = ({ rootElement, theme, renderLayout, layout }) => {
    const plugins = getPlugins("cms-editor-content");
    const themeLayout = theme.layouts.find(l => l.name === layout);

    if (renderLayout && !themeLayout) {
        return `Layout "${layout}" was not found in your theme!`;
    }

    let content = <Element id={rootElement.id} />;

    content = renderLayout ? React.createElement(themeLayout.component, null, content) : content;

    return (
        <ContentContainer theme={theme}>
            {plugins.map(plugin => React.cloneElement(plugin.render(), { key: plugin.name }))}
            <BaseContainer>{content}</BaseContainer>
        </ContentContainer>
    );
};

const stateToProps = state => ({
    rootElement: state.elements[getContent(state).id],
    layout: get(getPage(state), "settings.general.layout"),
    renderLayout: isPluginActive("cms-toolbar-preview")(state)
});

export default compose(
    connect(stateToProps),
    withTheme()
)(Content);
