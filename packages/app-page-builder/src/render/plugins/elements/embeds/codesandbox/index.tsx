import React from "react";
import { OEmbed } from "~/render/components/OEmbed";
import { PbRenderElementPlugin } from "~/types";
import { createCodesandbox } from "@webiny/app-page-builder-elements/renderers/embeds/codesandbox";
import { isLegacyRenderingEngine } from "~/utils";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? function (props) {
          return <OEmbed element={props.element} />;
      }
    : createCodesandbox();

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-codesandbox",
        type: "pb-render-page-element",
        elementType: "codesandbox",
        render
    };
};
