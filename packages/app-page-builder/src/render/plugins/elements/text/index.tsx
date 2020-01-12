import React from "react";
import Text from "./Text";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-text",
        type: "pb-render-page-element",
        elementType: "text",
        render(props) {
            return <Text {...props} />;
        }
    };
};
