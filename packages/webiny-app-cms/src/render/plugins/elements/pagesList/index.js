// @flow
import React from "react";
import type { PluginType } from "webiny-plugins/types";
import PagesList from "./PagesList";
import DefaultPageList from "./components/DefaultPagesList";

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
        name: "cms-pages-list-component-default",
        type: "cms-pages-list-component",
        title: "Default page list",
        component: DefaultPageList
    },
    {
        name: "cms-pages-list-component-default-2",
        type: "cms-pages-list-component",
        title: "Default page list-2",
        component: DefaultPageList
    }
]: Array<PluginType>);
