// @flow
import React from "react";
import Row from "./Row";
import type { PbRenderElementPlugin } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-row",
        type: "pb-render-page-element",
        elementType: "row",
        render(props) {
            return <Row {...props} />;
        }
    };
};
