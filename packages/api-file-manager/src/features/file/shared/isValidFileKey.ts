/**
 * Security: a file record must point only at the object uploaded for that file id.
 *
 * Keys come from `FileKey` as `[keyPrefix/]<id>/<name>`, so the id is either the first
 * segment (no prefix) or the segment right before the file name (with a prefix).
 * Anything that could escape the tenant folder, or point at another file's object, is refused.
 */
export const isValidFileKey = (id: string, key: string): boolean => {
    if (!id || !key || key.includes("\\") || key.startsWith("/")) {
        return false;
    }

    const segments = key.split("/");
    if (segments.length < 2) {
        return false;
    }

    if (
        segments.some(
            segment => !segment.trim() || segment.trim() === "." || segment.trim() === ".."
        )
    ) {
        return false;
    }

    return segments[0] === id || segments[segments.length - 2] === id;
};
