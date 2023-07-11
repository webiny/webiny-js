import kebabCase from "lodash/kebabCase";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { createList } from "@webiny/app-page-builder-elements/renderers/list";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "list");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render: createList()
    };
};
