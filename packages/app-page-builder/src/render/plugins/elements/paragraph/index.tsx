import kebabCase from "lodash/kebabCase";
import Paragraph from "./Paragraph";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { createParagraph } from "@webiny/app-page-builder-elements/renderers/paragraph";
import { isLegacyRenderingEngine } from "~/utils";
import React from "react";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? props => <Paragraph {...props} />
    : createParagraph();

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "paragraph");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render
    };
};
