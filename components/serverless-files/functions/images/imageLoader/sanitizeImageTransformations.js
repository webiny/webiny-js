// @flow
const SUPPORTED_IMAGE_RESIZE_WIDTHS = [100, 300, 500, 750, 1000, 1500, 2500];

/**
 * Takes only allowed transformations into consideration, and discards the rest.
 */
module.exports = args => {
    const transformations = {};

    if (args) {
        let width = parseInt(args.width);
        if (width > 0) {
            transformations.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[0];
            let i = SUPPORTED_IMAGE_RESIZE_WIDTHS.length;
            while (i >= 0) {
                if (width === SUPPORTED_IMAGE_RESIZE_WIDTHS[i]) {
                    transformations.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[i];
                    break;
                }

                if (width > SUPPORTED_IMAGE_RESIZE_WIDTHS[i]) {
                    // Use next larger width. If there isn't any, use current.
                    transformations.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[i + 1];
                    if (!transformations.width) {
                        transformations.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[i];
                    }
                    break;
                }

                i--;
            }
        }
    }

    if (Object.keys(transformations).length > 0) {
        return transformations;
    }

    return null;
};
