// @flow
import React from "react";
import type { PluginType } from "webiny-plugins/types";
import PagesList from "./PagesList";
import GridPageList from "./components/GridPageList";

export default ([
    {
        name: "pb-render-element-pages-list",
        type: "pb-render-element",
        elementType: "pages-list",
        render({ element, theme }) {
            return <PagesList data={element.data} theme={theme} />;
        }
    },
    {
        name: "pb-page-element-pages-list-component-default",
        type: "pb-page-element-pages-list-component",
        title: "Grid list",
        component: GridPageList
    }
]: Array<PluginType>);
