// @flow
import objectHash from "object-hash";

const SUPPORTED_IMAGE_RESIZE_WIDTHS = [100, 300, 500, 750, 1000, 1500, 2500];

/**
 * Takes only allowed options into consideration, and discards the rest.
 */
const sanitizeImageOptions = args => {
    const output = { options: {}, hasOptions: false, hash: "" };

    if (args) {
        let width = parseInt(args.width);
        if (width > 0) {
            output.hasOptions = true;
            output.options.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[0];
            let i = SUPPORTED_IMAGE_RESIZE_WIDTHS.length;
            while (i >= 0) {
                if (width === SUPPORTED_IMAGE_RESIZE_WIDTHS[i]) {
                    output.options.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[i];
                    break;
                }

                if (width > SUPPORTED_IMAGE_RESIZE_WIDTHS[i]) {
                    // Use next larger width. If there isn't any, use current.
                    output.options.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[i + 1];
                    if (!output.options.width) {
                        output.options.width = SUPPORTED_IMAGE_RESIZE_WIDTHS[i];
                    }
                    break;
                }

                i--;
            }
        }
    }

    output.hash = objectHash(output.options);

    return output;
};

export default sanitizeImageOptions;
