// @flow
import React from "react";
import Image from "./Image";
import type { PbRenderElementPluginType } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPluginType => {
    return {
        name: "pb-render-page-element-image",
        type: "pb-render-page-element",
        elementType: "image",
        render(props) {
            return <Image {...props} />;
        }
    };
};