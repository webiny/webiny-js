/*
 * The image types a screenshot may be, and the file extension each is committed under. GitHub
 * renders an attachment by extension, so an unrecognised type saved as `.png` would not display.
 * One map so the check at the edge and the naming at the end cannot disagree.
 */
export const EXTENSION_BY_MEDIA_TYPE: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp"
};

export function isSupportedScreenshotMediaType(mediaType: string): boolean {
    return mediaType in EXTENSION_BY_MEDIA_TYPE;
}
