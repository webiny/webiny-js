// @flow
import React from "react"; // eslint-disable-line
import { Image } from "webiny-ui/Image"; // eslint-disable-line
import type { ImagePlugin } from "webiny-app/types";

const convertTransformToQueryParams = (transform: Object): string => {
    return Object.keys(transform)
        .map(key => `${key}=${transform[key]}`)
        .join("&");
};

const imagePlugin: ImagePlugin = {
    name: "image-component",
    type: "image-component",
    render(props) {
        let { src, transform, ...rest } = props;
        if (transform) {
            src += "?" + convertTransformToQueryParams(transform);
        }

        return <Image {...rest} src={src} />;
    }
};

export default imagePlugin;
