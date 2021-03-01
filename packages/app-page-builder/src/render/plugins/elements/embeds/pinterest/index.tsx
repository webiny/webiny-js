import React from "react";
import { PbRenderElementPlugin } from "../../../../../types";
import PinterestEmbed from "./PinterestEmbed";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-pinterest",
        type: "pb-render-page-element",
        elementType: "pinterest",
        render(props) {
            return <PinterestEmbed element={props.element} />;
        }
    };
};
