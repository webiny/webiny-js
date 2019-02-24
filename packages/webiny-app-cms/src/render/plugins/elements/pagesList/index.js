// @flow
import React from "react";
import type { PluginType } from "webiny-plugins/types";
import PagesList from "./PagesList";
import GridPageList from "./components/GridPageList";

export default ([
    {
        name: "cms-render-element-pages-list",
        type: "cms-render-element",
        element: "cms-element-pages-list",
        render({ element, theme }) {
            return <PagesList data={element.data} theme={theme} />;
        }
    },
    {
        name: "cms-element-pages-list-component-default",
        type: "cms-element-pages-list-component",
        title: "Grid list",
        component: GridPageList
    }
]: Array<PluginType>);
