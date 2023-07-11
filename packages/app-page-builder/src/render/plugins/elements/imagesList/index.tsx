import kebabCase from "lodash/kebabCase";
import { PluginCollection } from "@webiny/plugins/types";
import {
    PbRenderElementPluginArgs,
    PbRenderElementPlugin,
    PbPageElementImagesListComponentPlugin
} from "~/types";

import { createDefaultImagesListComponent } from "@webiny/app-page-builder-elements/renderers/imagesList/imagesComponents";
import { createImagesList } from "@webiny/app-page-builder-elements/renderers/imagesList";
import { plugins } from "@webiny/plugins";

export default (args: PbRenderElementPluginArgs = {}): PluginCollection => {
    const elementType = kebabCase(args.elementType || "images-list");

    return [
        {
            name: `pb-render-page-element-${elementType}`,
            type: "pb-render-page-element",
            elementType: elementType,
            render: createImagesList({
                imagesListComponents: () => {
                    const registeredPlugins =
                        plugins.byType<PbPageElementImagesListComponentPlugin>(
                            "pb-page-element-images-list-component"
                        );

                    return registeredPlugins.map(plugin => {
                        return {
                            id: plugin.componentName,
                            name: plugin.title,
                            component: plugin.component
                        };
                    });
                }
            })
        } as PbRenderElementPlugin,
        {
            name: "pb-page-element-images-list-component-mosaic",
            type: "pb-page-element-images-list-component",
            title: "Mosaic",
            componentName: "mosaic",
            component: createDefaultImagesListComponent()
        } as PbPageElementImagesListComponentPlugin
    ];
};
