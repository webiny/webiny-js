import React from "react";
import { PageBuilderProvider } from "../../contexts/PageBuilder";
import { AppTemplateRendererPlugin } from "@webiny/app-template/types";

const plugins: AppTemplateRendererPlugin[] = [
    {
        type: "app-template-renderer",
        name: "app-template-renderer-page-builder",
        render(children) {
            return <PageBuilderProvider>{children}</PageBuilderProvider>;
        }
    }
];

export default plugins;
