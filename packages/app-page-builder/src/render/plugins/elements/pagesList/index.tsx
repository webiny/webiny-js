import React from "react";
import kebabCase from "lodash/kebabCase";
import { Link } from "@webiny/react-router";
import { PluginCollection } from "@webiny/plugins/types";
import { createDefaultPagesListComponent } from "@webiny/app-page-builder-elements/renderers/pagesList/pagesListComponents";
import { PePagesList } from "./PePagesList";
import {
    PbRenderElementPluginArgs,
    PbRenderElementPlugin,
    PbPageElementPagesListComponentPlugin
} from "~/types";

export default (args: PbRenderElementPluginArgs = {}): PluginCollection => {
    const elementType = kebabCase(args.elementType || "pages-list");

    return [
        {
            name: `pb-render-page-element-${elementType}`,
            type: "pb-render-page-element",
            elementType: elementType,
            render: PePagesList
        } as PbRenderElementPlugin,
        {
            name: "pb-page-element-pages-list-component-default",
            type: "pb-page-element-pages-list-component",
            title: "Grid list",
            componentName: "default",
            component: createDefaultPagesListComponent({
                linkComponent: ({ href, children, ...rest }) => {
                    return (
                        <Link to={href!} {...rest}>
                            {children}
                        </Link>
                    );
                }
            })
        } as PbPageElementPagesListComponentPlugin
    ];
};
