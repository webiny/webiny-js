/*
 * The version of a `<id>#<version>` revision id without leading zeros; `null` without a numeric
 * one.
 */
export const getRevisionNumber = (revisionId: string): string | null => {
    const index = revisionId.indexOf("#");
    if (index === -1) {
        return null;
    }
    const version = Number(revisionId.slice(index + 1));
    if (!Number.isFinite(version)) {
        return null;
    }
    return String(version);
};
