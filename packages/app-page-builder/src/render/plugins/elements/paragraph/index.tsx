import kebabCase from "lodash/kebabCase";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { createParagraph } from "@webiny/app-page-builder-elements/renderers/paragraph";
import { DynamicSourceContext } from "@webiny/app-dynamic-pages/contexts/DynamicSource";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "paragraph");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render: createParagraph({ dynamicSourceContext: DynamicSourceContext })
    };
};
