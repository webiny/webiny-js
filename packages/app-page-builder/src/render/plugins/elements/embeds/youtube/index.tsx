import kebabCase from "lodash/kebabCase";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { createYoutube } from "@webiny/app-page-builder-elements/renderers/embeds/youtube";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "youtube");

    return {
        name: "pb-render-page-element-" + elementType,
        type: "pb-render-page-element",
        elementType: elementType,
        render: createYoutube()
    };
};
