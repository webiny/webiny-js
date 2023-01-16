import React from "react";
import kebabCase from "lodash/kebabCase";
import Image from "./Image";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { createImage } from "@webiny/app-page-builder-elements/renderers/image";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "image");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        renderer: createImage(),
        render(props) {
            return <Image {...props} />;
        }
    };
};
