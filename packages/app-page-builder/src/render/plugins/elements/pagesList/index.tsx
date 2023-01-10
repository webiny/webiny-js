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
import { createPagesList } from "@webiny/app-page-builder-elements/renderers/pagesList";
import { createDefaultDataLoader } from "@webiny/app-page-builder-elements/renderers/pagesList/dataLoaders";
import { plugins } from "@webiny/plugins";
import { getTenantId, isLegacyRenderingEngine } from "~/utils";
import { createDefaultPagesListComponent } from "@webiny/app-page-builder-elements/renderers/pagesList/pagesListComponents";

export default (args: PbRenderElementPluginArgs = {}): PluginCollection => {
    const elementType = kebabCase(args.elementType || "pages-list");

    return [
        {
            name: `pb-render-page-element-${elementType}`,
            type: "pb-render-page-element",
            elementType: elementType,
            renderer: createPagesList({
                dataLoader: createDefaultDataLoader({
                    apiUrl: process.env.REACT_APP_API_URL + "/graphql",
                    includeHeaders: {
                        "x-tenant": getTenantId()
                    }
                }),
                pagesListComponents: () => {
                    const registeredPlugins = plugins.byType<PbPageElementPagesListComponentPlugin>(
                        "pb-page-element-pages-list-component"
                    );

                    return registeredPlugins.map(plugin => {
                        return {
                            id: plugin.componentName,
                            name: plugin.title,
                            component: plugin.component
                        };
                    });
                }
            }),
            render({ element, theme }) {
                /**
                 * Figure out correct type for element data or PagesList.data
                 */
                // TODO @ts-refactor
                // @ts-ignore
                return <PagesList data={element.data} theme={theme} />;
            }
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
