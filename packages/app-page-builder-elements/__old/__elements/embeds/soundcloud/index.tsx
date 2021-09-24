import React from "react";
import kebabCase from "lodash/kebabCase";
import OEmbed from "../~/components/OEmbed";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "../~/types";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "soundcloud");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render(props) {
            return <OEmbed element={props.element} />;
        }
    };
};
