import React from "react";
import OEmbed from "../~/components/OEmbed";
import { PbRenderElementPlugin } from "../~/types";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-codesandbox",
        type: "pb-render-page-element",
        elementType: "codesandbox",
        render(props) {
            return <OEmbed element={props.element} />;
        }
    };
};
