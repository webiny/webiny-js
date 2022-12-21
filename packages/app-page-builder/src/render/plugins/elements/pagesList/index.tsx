import React from "react";
import kebabCase from "lodash/kebabCase";
import PagesList from "./PagesList";
import GridPageList from "./components/GridPageList";
import {
    PbRenderElementPluginArgs,
    PbRenderElementPlugin,
    PbPageElementPagesListComponentPlugin
} from "~/types";
import {PluginCollection} from "@webiny/plugins/types";
import {createPagesList} from "@webiny/app-page-builder-elements/renderers/pagesList";

export default (args: PbRenderElementPluginArgs = {}): PluginCollection => {
    const elementType = kebabCase(args.elementType || "pages-list");

    return [
        {
            name: `pb-render-page-element-${elementType}`,
            type: "pb-render-page-element",
            elementType: elementType,
            renderer: createPagesList({pagesListComponents: []}),
            render({element, theme}) {
                /**
                 * Figure out correct type for element data or PagesList.data
                 */
                // TODO @ts-refactor
                // @ts-ignore
                return <PagesList data={element.data} theme={theme}/>;
            }
        } as PbRenderElementPlugin,
        {
            name: "pb-page-element-pages-list-component-default",
            type: "pb-page-element-pages-list-component",
            title: "Grid list",
            componentName: "default",
            component: GridPageList
        } as PbPageElementPagesListComponentPlugin
    ];
};
