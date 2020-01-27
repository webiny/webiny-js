import React from "react";
import Image from "./Image";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-image",
        type: "pb-render-page-element",
        elementType: "image",
        render(props) {
            return <Image {...props} />;
        }
    };
};
