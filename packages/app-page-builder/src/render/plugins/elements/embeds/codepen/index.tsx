import React from "react";
import OEmbed from "@webiny/app-page-builder/render/components/OEmbed";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-codepen",
        type: "pb-render-page-element",
        elementType: "codepen",
        render(props) {
            return <OEmbed element={props.element} />;
        }
    };
};
