import React from "react";
import kebabCase from "lodash/kebabCase";
import { OEmbed, OEmbedProps } from "~/render/components/OEmbed";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { createTwitter } from "@webiny/app-page-builder-elements/renderers/embeds/twitter";
import { isLegacyRenderingEngine } from "~/utils";

const oembed: Partial<OEmbedProps> = {
    global: "twttr",
    sdk: "https://platform.twitter.com/widgets.js",
    init({ node }) {
        // @ts-ignore
        window.twttr.widgets.load(node);
    }
};

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? function (props) {
          return <OEmbed element={props.element} {...oembed} />;
      }
    : createTwitter();

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "twitter");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render
    };
};
