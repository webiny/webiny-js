import React from "react";
import Menu from "./Menu";
import MenuNavigation from "./components/MenuNavigation";
import MenuForm from "./components/MenuForm";

import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";
import { PbPageElementMenuComponentPlugin } from "@webiny/app-page-builder/types";

export default [
    {
        name: "pb-render-page-element-menu",
        type: "pb-render-page-element",
        elementType: "menu",
        render({ element, theme }) {
            return <Menu data={element.data} theme={theme} />;
        }
    } as PbRenderElementPlugin,
    {   
        name: "pb-page-element-menu-component-default",
        type: "pb-page-element-menu-component",
        title: "Menu Navigation",
        componentName: "default",
        component: MenuNavigation
    } as PbPageElementMenuComponentPlugin,
    {   
        name: "pb-page-element-menu-component-form",
        type: "pb-page-element-menu-component",
        title: "Menu Form",
        componentName: "Menu Form",
        component: MenuForm
    } as PbPageElementMenuComponentPlugin
];