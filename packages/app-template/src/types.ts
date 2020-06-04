import * as React from "react";
import { Plugin } from "@webiny/plugins/types";

export type AppTemplateRenderer = (children: React.ReactElement) => React.ReactElement;

export type AppTemplateRendererPlugin = Plugin & {
    type: "app-template-renderer";
    render: AppTemplateRenderer;
};
