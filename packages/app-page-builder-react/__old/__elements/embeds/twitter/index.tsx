import React from "react";
import kebabCase from "lodash/kebabCase";
import OEmbed from "../~/components/OEmbed";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "../~/types";

const oembed = {
    global: "twttr",
    sdk: "https://platform.twitter.com/widgets.js",
    init({ node }) {
        // @ts-ignore
        window.twttr.widgets.load(node);
    }
};

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "twitter");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render(props) {
            return <OEmbed element={props.element} {...oembed} />;
        }
    };
};
