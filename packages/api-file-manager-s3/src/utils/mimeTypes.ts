// @ts-expect-error
import vendorTypes from "mime/types/other";
// @ts-expect-error
import standardTypes from "mime/types/standard";

/**
 * We need to get all extensions that are defined for a specific content type.
 * This operation is not available via the `mime` package, so we create such an object ourselves.
 */
export const mimeTypes: Record<string, string[]> = {
    ...vendorTypes,
    ...standardTypes
};
