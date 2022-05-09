import React from "react";
import kebabCase from "lodash/kebabCase";
import Paragraph from "./Paragraph";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "paragraph");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render(props) {
            return <Paragraph {...props} />;
        }
    };
};
