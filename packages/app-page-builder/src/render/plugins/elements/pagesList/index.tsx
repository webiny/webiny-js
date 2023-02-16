import React from "react";
import kebabCase from "lodash/kebabCase";
import PagesList from "./PagesList";
import GridPageList from "./components/GridPageList";
import {
    PbRenderElementPluginArgs,
    PbRenderElementPlugin,
    PbPageElementPagesListComponentPlugin
} from "~/types";
import { PluginCollection } from "@webiny/plugins/types";
import { isLegacyRenderingEngine } from "~/utils";
import { createDefaultPagesListComponent } from "@webiny/app-page-builder-elements/renderers/pagesList/pagesListComponents";
import PePagesList from "./PePagesList";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? ({ element }) => {
          // @ts-ignore Resolve once we deprecate legacy rendering engine.
          return <PagesList data={element.data} />;
      }
    : PePagesList;

export default (args: PbRenderElementPluginArgs = {}): PluginCollection => {
    const elementType = kebabCase(args.elementType || "pages-list");

    return [
        {
            name: `pb-render-page-element-${elementType}`,
            type: "pb-render-page-element",
            elementType: elementType,
            render
        } as PbRenderElementPlugin,
        {
            name: "pb-page-element-pages-list-component-default",
            type: "pb-page-element-pages-list-component",
            title: "Grid list",
            componentName: "default",
            component: isLegacyRenderingEngine ? GridPageList : createDefaultPagesListComponent()
        } as PbPageElementPagesListComponentPlugin
    ];
};
