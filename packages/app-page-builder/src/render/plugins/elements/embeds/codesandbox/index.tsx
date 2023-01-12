import React from "react";
import { OEmbed } from "~/render/components/OEmbed";
import { PbRenderElementPlugin } from "~/types";
import { createCodesandbox } from "@webiny/app-page-builder-elements/renderers/embeds/codesandbox";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-codesandbox",
        type: "pb-render-page-element",
        elementType: "codesandbox",
        renderer: createCodesandbox(),
        render(props) {
            return <OEmbed element={props.element} />;
        }
    };
};
