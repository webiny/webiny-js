// @flow
import React from "react";
import { get } from "dot-prop-immutable";
import { connect } from "react-redux";
import styled from "react-emotion";
import { compose, pure } from "recompose";
import { getPlugins, getPlugin } from "webiny-app/plugins";
import { withTheme } from "webiny-app-cms/theme";
import { getContent } from "webiny-app-cms/editor/selectors";
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
    ...get(theme, "elements.body", {})
}));

const BaseContainer = styled("div")({
    width: "100%",
    left: 52,
    margin: "0 auto"
});

const Content = pure(({ rootElement, theme, previewLayout }) => {
    const plugins = getPlugins("cms-editor-content");
    const layout = (previewLayout && getPlugin(previewLayout)) || null;

    let renderedContent = <Element id={rootElement.id} />;

    renderedContent = layout ? layout.render(renderedContent) : renderedContent;

    return (
        <ContentContainer theme={theme}>
            {plugins.map(plugin => React.cloneElement(plugin.render(), { key: plugin.name }))}
            <BaseContainer>{renderedContent}</BaseContainer>
        </ContentContainer>
    );
});

const stateToProps = state => ({
    rootElement: state.elements[getContent(state).id],
    previewLayout: state.previewLayout
});

export default compose(
    connect(stateToProps),
    withTheme()
)(Content);
