import React from "react";
import kebabCase from "lodash/kebabCase";
import { OEmbed, OEmbedProps } from "~/render/components/OEmbed";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import YoutubeEmbed from "./YoutubeEmbed";
import { createYoutube } from "@webiny/app-page-builder-elements/renderers/embeds/youtube";
import { isLegacyRenderingEngine } from "~/utils";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const renderEmbed: OEmbedProps["renderEmbed"] = props => {
        return <YoutubeEmbed {...props} />;
    };

    const elementType = kebabCase(args.elementType || "youtube");

    // @ts-ignore Resolve once we deprecate legacy rendering engine.
    const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
        ? function (props) {
              return <OEmbed element={props.element} renderEmbed={renderEmbed} />;
          }
        : createYoutube();

    return {
        name: "pb-render-page-element-" + elementType,
        type: "pb-render-page-element",
        elementType: elementType,
        render
    };
};
