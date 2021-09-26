import React from "react";
import OEmbed from "../~/components/OEmbed";
import { PbRenderElementPlugin } from "../~/types";

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
