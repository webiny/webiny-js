// @flow
const SUPPORTED_IMAGE_RESIZE_WIDTHS = [100, 300, 500, 750, 1000, 1500, 2500];

/**
 * Takes only allowed transformations into consideration, and discards the rest.
 */
const sanitizeImageTransformations = args => {
    const output = { transformations: {}, empty: true };

    if (args) {
        let width = parseInt(args.width);
        if (width > 0) {
            output.empty = false;
            output.transformations.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[0];
            let i = SUPPORTED_IMAGE_RESIZE_WIDTHS.length;
            while (i >= 0) {
                if (width === SUPPORTED_IMAGE_RESIZE_WIDTHS[i]) {
                    output.transformations.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[i];
                    break;
                }

                if (width > SUPPORTED_IMAGE_RESIZE_WIDTHS[i]) {
                    // Use next larger width. If there isn't any, use current.
                    output.transformations.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[i + 1];
                    if (!output.transformations.width) {
                        output.transformations.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[i];
                    }
                    break;
                }

                i--;
            }
        }
    }

    return output;
};

export default sanitizeImageTransformations;
