import React from "react";
import PagesList from "./PagesList";
import GridPageList from "./components/GridPageList";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";
import { PbPageElementPagesListComponentPlugin } from "@webiny/app-page-builder/admin/types";

export default [
    {
        name: "pb-render-page-element-pages-list",
        type: "pb-render-page-element",
        elementType: "pages-list",
        render({ element, theme }) {
            return <PagesList data={element.data} theme={theme} />;
        }
    } as PbRenderElementPlugin,
    {
        name: "pb-page-element-pages-list-component-default",
        type: "pb-page-element-pages-list-component",
        title: "Grid list",
        componentName: "default",
        component: GridPageList
    } as PbPageElementPagesListComponentPlugin
];
