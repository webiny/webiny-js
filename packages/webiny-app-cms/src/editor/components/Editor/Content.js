// @flow
import React from "react";
import invariant from "invariant";
import { get } from "dot-prop-immutable";
import { connect } from "react-redux";
import styled from "react-emotion";
import compose from "recompose/compose";
import { getPlugins, getPlugin } from "webiny-app/plugins";
import { withTheme } from "webiny-app-cms/theme";
import { getContent, getEditor, getActivePlugin } from "webiny-app-cms/editor/selectors";
import Element from "webiny-app-cms/editor/components/Element";
import RenderElement from "webiny-app-cms/render/components/Element";

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

const renderPreview = (content, activePreview) => {
    const plugin = getPlugin(activePreview);

    if (!plugin) {
        return content;
    }

    const wrappedContent = plugin.renderPreview({ content });
    invariant(
        React.isValidElement(wrappedContent),
        `"${plugin.name}" must return a valid React element from "renderPreview" function!`
    );

    return wrappedContent;
};

const Content = ({ content, theme, previewLayout, activePreview, renderContent }) => {
    const plugins = getPlugins("cms-editor-content");
    const layout = (previewLayout && getPlugin(previewLayout)) || null;

    let renderedContent = renderContent ? (
        <RenderElement element={content} />
    ) : (
        <Element element={content} />
    );

    renderedContent = layout ? layout.render(renderedContent) : renderedContent;

    return (
        <ContentContainer theme={theme}>
            {plugins.map(plugin => React.cloneElement(plugin.render(), { key: plugin.name }))}
            <BaseContainer>{renderPreview(renderedContent, activePreview)}</BaseContainer>
        </ContentContainer>
    );
};

const stateToProps = state => ({
    content: getContent(state),
    previewLayout: getEditor(state).previewLayout,
    activePreview: getActivePlugin("cms-editor-content-preview")(state)
});

export default compose(
    connect(stateToProps),
    withTheme()
)(Content);
