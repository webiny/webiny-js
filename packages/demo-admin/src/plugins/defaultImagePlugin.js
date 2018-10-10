// @flow
import React from "react";
import { Image } from "webiny-ui/Image";
import type { ImagePlugin } from "webiny-app/types";

const defaultImagePlugin = {
    name: "image-component-plugin-default",
    type: "image-component-plugin",
    render: props => {
        return <Image {...props} />;
    },
    getImageUrl() {
        return "super url";
    }
};

export default defaultImagePlugin;
