import React from "react";
import kebabCase from "lodash/kebabCase";
import Paragraph from "./Paragraph";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { createParagraph } from "@webiny/app-page-builder-elements/renderers/paragraph";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "paragraph");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        renderer: createParagraph(),
        render(props) {
            return <Paragraph {...props} />;
        }
    };
};
