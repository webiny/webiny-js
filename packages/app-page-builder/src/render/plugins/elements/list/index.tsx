import kebabCase from "lodash/kebabCase";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import List from "./List";
import { createList } from "@webiny/app-page-builder-elements/renderers/list";
import { isLegacyRenderingEngine } from "~/utils";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine ? List : createList();

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "list");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render
    };
};
