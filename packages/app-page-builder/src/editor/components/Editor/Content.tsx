import React from "react";
import styled from "@emotion/styled";
import {
    editorPageElementsRootElementSelector,
    editorPageLayoutSelector,
    isPluginActiveSelectorFactory
} from "./recoil";
import { css } from "emotion";
import { getPlugins } from "@webiny/plugins";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import Element from "@webiny/app-page-builder/editor/components/Element";
import { Elevation } from "@webiny/ui/Elevation";
import { PbElement, PbPageLayout, PbPageLayoutPlugin } from "@webiny/app-page-builder/types";
import { PbEditorContentPlugin } from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

const ContentContainer = styled("div")(({theme}) => ({
    backgroundColor: (theme as any)?.colors?.background,
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
const renderContent = (layout: PbPageLayout, rootElement: PbElement, render: boolean) => {
    const content = (<Element id={ rootElement.id }/>);
    if (!render) {
        return content;
    }
    return React.createElement(layout.component, null, content);
};
// TODO verify that this works
const isPluginActiveSelector = isPluginActiveSelectorFactory("pb-editor-toolbar-preview");

export default () => {
    const rootElement = useRecoilValue(editorPageElementsRootElementSelector);
    const renderLayout = useRecoilValue(isPluginActiveSelector);
    const layout = useRecoilValue(editorPageLayoutSelector);
    const {theme} = usePageBuilder();
    const plugins = getPlugins<PbEditorContentPlugin>("pb-editor-content");
    const layouts = React.useMemo(() => {
        const plugins = getPlugins<PbPageLayoutPlugin>("pb-page-layout");
        return plugins.map(pl => pl.layout);
    }, []);
    const themeLayout = layouts.find(l => l.name === layout);
    if (renderLayout && !themeLayout) {
        return <div>Layout &quot;{ layout }&quot; was not found in your theme!</div>;
    }
    return (
        <Elevation className={ contentContainerWrapper } z={ 2 }>
            <ContentContainer theme={ theme }>
                { plugins.map(plugin => React.cloneElement(plugin.render(), {key: plugin.name})) }
                <BaseContainer className={ "webiny-pb-editor-content-preview" }>
                    { renderContent(themeLayout, rootElement, renderLayout) }
                </BaseContainer>
            </ContentContainer>
        </Elevation>
    );
};