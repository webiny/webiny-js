/*
 * The version of a `<id>#<version>` revision id without leading zeros; `null` without a numeric
 * one.
 */
export const getRevisionNumber = (revisionId: string): string | null => {
    const index = revisionId.indexOf("#");
    if (index === -1) {
        return null;
    }
    const versionText = revisionId.slice(index + 1);
    const version = Number(versionText);
    if (!Number.isFinite(version)) {
        return null;
    }
    return String(version);
};
