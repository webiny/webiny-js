import kebabCase from "lodash/kebabCase";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import List from "./List";
import { createList } from "@webiny/app-page-builder-elements/renderers/list";
import { isLegacyRenderingEngine } from "~/utils";
import React from "react";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine ? props => <List {...props} /> : createList();

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "list");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render
    };
};
