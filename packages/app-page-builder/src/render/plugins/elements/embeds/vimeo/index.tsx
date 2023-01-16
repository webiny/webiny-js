import React from "react";
import kebabCase from "lodash/kebabCase";
import { OEmbed, OEmbedProps } from "~/render/components/OEmbed";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import VimeoEmbed from "./VimeoEmbed";
import { createVimeo } from "@webiny/app-page-builder-elements/renderers/embeds/vimeo";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const renderEmbed: OEmbedProps["renderEmbed"] = props => {
        return <VimeoEmbed {...props} />;
    };

    const elementType = kebabCase(args.elementType || "vimeo");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        renderer: createVimeo(),
        render(props) {
            return <OEmbed element={props.element} renderEmbed={renderEmbed} />;
        }
    };
};
