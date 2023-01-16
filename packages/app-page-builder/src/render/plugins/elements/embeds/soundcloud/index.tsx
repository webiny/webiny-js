import React from "react";
import kebabCase from "lodash/kebabCase";
import { OEmbed } from "~/render/components/OEmbed";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { createSoundcloud } from "@webiny/app-page-builder-elements/renderers/embeds/soundcloud";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "soundcloud");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        renderer: createSoundcloud(),
        render(props) {
            return <OEmbed element={props.element} />;
        }
    };
};
