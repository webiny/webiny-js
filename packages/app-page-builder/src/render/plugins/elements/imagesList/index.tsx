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

export default (args: PbRenderElementPluginArgs = {}): PluginCollection => {
    const elementType = kebabCase(args.elementType || "images-list");

    return [
        {
            name: `pb-render-page-element-${elementType}`,
            type: "pb-render-page-element",
            elementType: elementType,
            render({ element, theme }) {
                return <ImagesList data={element.data as ImagesListProps["data"]} theme={theme} />;
            }
        } as PbRenderElementPlugin,
        {
            name: "pb-page-element-images-list-component-mosaic",
            type: "pb-page-element-images-list-component",
            title: "Mosaic",
            componentName: "mosaic",
            component: Mosaic
        } as PbPageElementImagesListComponentPlugin
    ];
};
