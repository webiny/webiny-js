import React from "react";
import kebabCase from "lodash/kebabCase";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "../../../../../types";
import PinterestEmbed from "./PinterestEmbed";
import { createPinterest } from "@webiny/app-page-builder-elements/renderers/embeds/pinterest";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "pinterest");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        renderer: createPinterest(),
        render(props) {
            return <PinterestEmbed element={props.element} />;
        }
    };
};
