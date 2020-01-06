// @flow
import React from "react";
import Button from "./Button";
import type { PbRenderElementPlugin } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-button",
        type: "pb-render-page-element",
        elementType: "button",
        render(props) {
            return <Button {...props} />;
        }
    };
};
