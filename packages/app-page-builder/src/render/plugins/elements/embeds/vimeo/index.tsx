import React from "react";
import kebabCase from "lodash/kebabCase";
import { OEmbed, OEmbedProps } from "~/render/components/OEmbed";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import VimeoEmbed from "./VimeoEmbed";
import { createVimeo } from "@webiny/app-page-builder-elements/renderers/embeds/vimeo";
import { isLegacyRenderingEngine } from "~/utils";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const renderEmbed: OEmbedProps["renderEmbed"] = props => {
        return <VimeoEmbed {...props} />;
    };

    const elementType = kebabCase(args.elementType || "vimeo");

    // @ts-ignore Resolve once we deprecate legacy rendering engine.
    const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
        ? function (props) {
              return <OEmbed element={props.element} renderEmbed={renderEmbed} />;
          }
        : createVimeo();

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render
    };
};
