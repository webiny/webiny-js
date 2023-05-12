import React from "react";
import kebabCase from "lodash/kebabCase";
import { OEmbed } from "~/render/components/OEmbed";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { createSoundcloud } from "@webiny/app-page-builder-elements/renderers/embeds/soundcloud";
import { isLegacyRenderingEngine } from "~/utils";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? function (props) {
          return <OEmbed element={props.element} />;
      }
    : createSoundcloud();

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "soundcloud");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render
    };
};
