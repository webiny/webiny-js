import React from "react";
import kebabCase from "lodash/kebabCase";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import Quote from "./Quote";
import { createQuote } from "@webiny/app-page-builder-elements/renderers/quote";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "quote");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        renderer: createQuote(),
        render(props) {
            return <Quote {...props} />;
        }
    };
};
