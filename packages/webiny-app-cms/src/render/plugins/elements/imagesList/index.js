// @flow
import React from "react";
import type { PluginType } from "webiny-plugins/types";
import ImagesList from "./ImagesList";
import Mosaic from "./components/Mosaic";
import Slider from "./components/Slider";

export default ([
    {
        name: "cms-render-element-images-list",
        type: "cms-render-element",
        element: "cms-element-images-list",
        render({ element, theme }) {
            return <ImagesList data={element.data} theme={theme} />;
        }
    },
    {
        name: "cms-element-images-list-component-mosaic",
        type: "cms-element-images-list-component",
        title: "Mosaic",
        component: Mosaic
    },
    {
        name: "cms-element-images-list-component-slider",
        type: "cms-element-images-list-component",
        title: "Slider",
        component: Slider
    }
]: Array<PluginType>);
