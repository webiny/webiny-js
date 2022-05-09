import React from "react";
import kebabCase from "lodash/kebabCase";
import Heading from "./Heading";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = args.elementType || "heading";

    return {
        name: `pb-render-page-element-${kebabCase(elementType)}`,
        type: "pb-render-page-element",
        elementType,
        render(props) {
            return <Heading {...props} />;
        }
    };
};
