import kebabCase from "lodash/kebabCase";
import { ParagraphRenderer } from "@webiny/app-page-builder-elements/renderers/paragraph";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "paragraph");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render: ParagraphRenderer
    };
};
