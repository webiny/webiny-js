import * as React from "react";
import { Plugin } from "@webiny/plugins/types";

export type AppTemplateHOC = (BaseComponent: React.ComponentType) => React.ComponentType;

export type AppTemplateHOCPlugin = Plugin & {
    type: "app-template-hoc";
    hoc: AppTemplateHOC;
};
