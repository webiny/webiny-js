// @flow
import React from "react";
import type { PluginType } from "webiny-plugins/types";
import ImagesList from "./ImagesList";
import Mosaic from "./components/Mosaic";
import Slider from "./components/Slider";

export default ([
    {
        name: "pb-render-element-images-list",
        type: "pb-render-element",
        elementType: "images-list",
        render({ element, theme }) {
            return <ImagesList data={element.data} theme={theme} />;
        }
    },
    {
        name: "pb-page-element-images-list-component-mosaic",
        type: "pb-page-element-images-list-component",
        title: "Mosaic",
        component: Mosaic
    },
    {
        name: "pb-page-element-images-list-component-slider",
        type: "pb-page-element-images-list-component",
        title: "Slider",
        component: Slider
    }
]: Array<PluginType>);
