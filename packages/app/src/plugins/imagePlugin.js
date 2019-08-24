// @flow
import React from "react"; // eslint-disable-line
import { Image } from "@webiny/ui/Image"; // eslint-disable-line
import type { ImageComponentPluginType } from "@webiny/app/types";

const SUPPORTED_IMAGE_RESIZE_WIDTHS = [100, 300, 500, 750, 1000, 1500, 2500];

/**
 * Width of the image should not be just any random number. For optimization reasons,
 * we only allow the ones listed in SUPPORTED_IMAGE_RESIZE_WIDTHS list (Webiny Cloud supports only these).
 */
const getSupportedImageResizeWidth = width => {
    let output = SUPPORTED_IMAGE_RESIZE_WIDTHS[0];
    let i = SUPPORTED_IMAGE_RESIZE_WIDTHS.length;
    while (i >= 0) {
        if (width === SUPPORTED_IMAGE_RESIZE_WIDTHS[i]) {
            output = SUPPORTED_IMAGE_RESIZE_WIDTHS[i];
            break;
        }

        if (width > SUPPORTED_IMAGE_RESIZE_WIDTHS[i]) {
            // Use next larger width. If there isn't any, use current.
            output = SUPPORTED_IMAGE_RESIZE_WIDTHS[i + 1];
            if (!output) {
                output = SUPPORTED_IMAGE_RESIZE_WIDTHS[i];
            }
            break;
        }

        i--;
    }

    return output;
};

/**
 * Currently we only allow "width" as a transform option.
 * @param args
 */
const sanitizeTransformArgs = (args: ?Object): Object => {
    const output = {};
    if (args) {
        let width = parseInt(args.width);
        if (width > 0) {
            output.width = getSupportedImageResizeWidth(width);
        }
    }

    return output;
};

const getSrcSetAutoSizes = (max: ?number) => {
    max = isFixedImageWidth(max) ? parseInt(max) : 2500;
    const maxWidth = getSupportedImageResizeWidth(max);
    return SUPPORTED_IMAGE_RESIZE_WIDTHS.filter((supportedWidth: number) => {
        return supportedWidth <= maxWidth;
    });
};

const convertTransformToQueryParams = (transform: Object): string => {
    return Object.keys(transform)
        .map(key => `${key}=${transform[key]}`)
        .join("&");
};

const isFixedImageWidth = width => {
    if (Number.isFinite(width)) {
        return true;
    }

    if (typeof width === "string" && width.endsWith("px")) {
        return true;
    }
    return false;
};

const imagePlugin: ImageComponentPluginType = {
    name: "image-component",
    type: "image-component",
    presets: {
        avatar: { width: 300 }
    },
    getImageSrc: props => {
        if (!props) {
            return "";
        }

        const { src, transform } = props;
        if (!transform) {
            return src;
        }

        if (!src || src.startsWith("data:") || src.endsWith("svg")) {
            return src;
        }

        let params = sanitizeTransformArgs(transform);
        params = convertTransformToQueryParams(params);
        return src + "?" + params;
    },
    render(props) {
        let { transform, srcSet, ...imageProps } = props;

        const src = imageProps.src;
        if (srcSet && srcSet === "auto") {
            srcSet = {};

            // Check if image width was forced, and additionally if width was set as pixels, with "px" in the value.
            let forcedWidth = props.width || (props.style && props.style.width);
            const srcSetAutoWidths = getSrcSetAutoSizes(forcedWidth);
            srcSetAutoWidths.forEach(width => {
                srcSet[width + "w"] = imagePlugin.getImageSrc({
                    src,
                    transform: { ...transform, width }
                });
            });
        }

        return <Image {...imageProps} srcSet={srcSet} src={src} />;
    }
};

export default imagePlugin;
