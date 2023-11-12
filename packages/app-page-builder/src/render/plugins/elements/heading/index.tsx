import kebabCase from "lodash/kebabCase";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { createHeading } from "@webiny/app-page-builder-elements/renderers/heading";
import { DynamicSourceContext } from "@webiny/app-dynamic-pages/contexts/DynamicSource";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = args.elementType || "heading";

    return {
        name: `pb-render-page-element-${kebabCase(elementType)}`,
        type: "pb-render-page-element",
        elementType,
        render: createHeading({ dynamicSourceContext: DynamicSourceContext })
    };
};
