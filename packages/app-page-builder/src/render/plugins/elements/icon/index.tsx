import React from "react";
import Icon from "./Icon";
import { PbRenderElementPlugin } from "../../../../types";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-icon",
        type: "pb-render-page-element",
        elementType: "icon",
        render(props) {
            return <Icon {...props} />;
        }
    };
};
