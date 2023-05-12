import React from "react";
import kebabCase from "lodash/kebabCase";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "../../../../../types";
import PinterestEmbed from "./PinterestEmbed";
import { createPinterest } from "@webiny/app-page-builder-elements/renderers/embeds/pinterest";
import { isLegacyRenderingEngine } from "~/utils";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? function (props) {
          return <PinterestEmbed element={props.element} />;
      }
    : createPinterest();

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "pinterest");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render
    };
};
