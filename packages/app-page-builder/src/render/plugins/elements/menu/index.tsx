import React from "react";
import Menu from "./Menu";
import GridMenu from "./components/GridMenu";
import MenuTemplate from "./components/MenuTemplate";

import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";
import { PbPageElementMenuComponentPlugin } from "@webiny/app-page-builder/types";

export default [
    {
        name: "pb-render-page-element-menu",
        type: "pb-render-page-element",
        elementType: "menu",
        render({ element, theme }) {
            console.log("RENDERING MENU with element data::::::::::::::");
            console.log(element.data);
            return <Menu data={element.data} theme={theme} />;
        }
    } as PbRenderElementPlugin,
    {
        name: "pb-page-element-menu-component-default",
        type: "pb-page-element-menu-component",
        title: "Menu Template",
        componentName: "default",
        component: MenuTemplate
    } as PbPageElementMenuComponentPlugin
];
