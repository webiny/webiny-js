import React from "react";
import kebabCase from "lodash/kebabCase";
import { PluginCollection } from "@webiny/plugins/types";
import { ImagesList, ImagesListProps } from "./ImagesList";
import { Mosaic } from "./components/Mosaic";
import {
    PbRenderElementPluginArgs,
    PbRenderElementPlugin,
    PbPageElementImagesListComponentPlugin
} from "~/types";
import { isLegacyRenderingEngine } from "~/utils";
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
            renderer: createImagesList({
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
            }),
            render({ element, theme }) {
                return <ImagesList data={element.data as ImagesListProps["data"]} theme={theme} />;
            }
        } as PbRenderElementPlugin,
        {
            name: "pb-page-element-images-list-component-mosaic",
            type: "pb-page-element-images-list-component",
            title: "Mosaic",
            componentName: "mosaic",
            component: isLegacyRenderingEngine ? Mosaic : createDefaultImagesListComponent()
        } as PbPageElementImagesListComponentPlugin
    ];
};
