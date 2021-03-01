import React from "react";
import OEmbed from "../../../../components/OEmbed";
import { PbRenderElementPlugin } from "../../../../../types";

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
