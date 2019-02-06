// @flow
import React from "react"; // eslint-disable-line
import { Image } from "webiny-ui/Image"; // eslint-disable-line
import type { ImagePlugin } from "webiny-app/types";

const SUPPORTED_IMAGE_RESIZE_WIDTHS = [100, 300, 500, 750, 1000, 1500, 2500];

/**
 * Width of the image should not be just any random number. For optimization reasons,
 * we only allow the ones listed in SUPPORTED_IMAGE_RESIZE_WIDTHS list (Webiny Cloud supports only these).
 */
const sanitizeTransformArgs = (args: ?Object): Object => {
    const output = {};
    if (args) {
        let width = parseInt(args.width);
        if (width > 0) {
            output.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[0];
            let i = SUPPORTED_IMAGE_RESIZE_WIDTHS.length;
            while (i >= 0) {
                if (width === SUPPORTED_IMAGE_RESIZE_WIDTHS[i]) {
                    output.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[i];
                    break;
                }

                if (width > SUPPORTED_IMAGE_RESIZE_WIDTHS[i]) {
                    // Use next larger width. If there isn't any, use current.
                    output.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[i + 1];
                    if (!output.width) {
                        output.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[i];
                    }
                    break;
                }

                i--;
            }
        }
    }

    return output;
};

const convertTransformToQueryParams = (transform: Object): string => {
    return Object.keys(transform)
        .map(key => `${key}=${transform[key]}`)
        .join("&");
};

const buildFullSrc = (src, transform) => {
    let params = sanitizeTransformArgs(transform);
    params = convertTransformToQueryParams(params);
    return src + "?" + params;
};

const imagePlugin: ImagePlugin = {
    name: "image-component",
    type: "image-component",
    presets: {
        avatar: { width: 300 }
    },
    render(props) {
        let { src, transform, srcSet, responsive, ...rest } = props;
        if (src.startsWith("data:")) {
            return <Image src={src} {...rest} />;
        }

        if (!srcSet && responsive) {
            srcSet = {
                "2500w": buildFullSrc(src, { ...transform, width: 2500 }),
                "1500w": buildFullSrc(src, { ...transform, width: 1500 }),
                "750w": buildFullSrc(src, { ...transform, width: 750 }),
                "500w": buildFullSrc(src, { ...transform, width: 500 }),
                "300w": buildFullSrc(src, { ...transform, width: 300 })
            };
        }

        if (transform) {
            src = buildFullSrc(src, transform);
        }

        return <Image src={src} srcSet={srcSet} {...rest} />;
    }
};

export default imagePlugin;
