import React from "react";
import { PbRenderElementPlugin } from "../../../../types";
import List from "./List";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-list",
        type: "pb-render-page-element",
        elementType: "list",
        render(props) {
            return <List {...props} />;
        }
    };
};
