/** The version of a `<id>#<version>` revision id without leading zeros; "" without one. */
export const getRevisionNumber = (revisionId: string): string => {
    const index = revisionId.indexOf("#");
    if (index === -1) {
        return "";
    }
    const version = Number(revisionId.slice(index + 1));
    return String(version);
};
