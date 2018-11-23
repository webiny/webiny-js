// @flow
import React from "react";
import type { RenderElementPluginType } from "webiny-app-cms/types";
import PagesList from "./PagesList";

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-pages-list",
        type: "cms-render-element",
        element: "cms-element-pages-list",
        render({ element, theme }) {
            return <PagesList settings={element.settings} theme={theme} />;
        }
    };
};

