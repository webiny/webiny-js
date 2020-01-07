import React from "react";
import OEmbed from "@webiny/app-page-builder/render/components/OEmbed";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-soundcloud",
        type: "pb-render-page-element",
        elementType: "soundcloud",
        render(props) {
            return <OEmbed element={props.element} />;
        }
    };
};
