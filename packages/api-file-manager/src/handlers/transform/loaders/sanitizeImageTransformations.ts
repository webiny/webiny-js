const SUPPORTED_IMAGE_RESIZE_WIDTHS: number[] = [100, 300, 500, 750, 1000, 1500, 2500];

export interface SanitizeImageArgs {
    width?: string;
}

export interface SanitizeImageTransformations {
    width: number;
}
/**
 * Takes only allowed transformations into consideration, and discards the rest.
 */
export default (args?: SanitizeImageArgs): SanitizeImageTransformations | null => {
    const transformations: Partial<SanitizeImageTransformations> = {};

    if (!args || !args.width) {
        return null;
    }
    const width = parseInt(args.width);
    if (width <= 0) {
        return null;
    }
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

    if (Object.keys(transformations).length > 0) {
        /**
         * It is safe to cast.
         */
        return transformations as SanitizeImageTransformations;
    }

    return null;
};
