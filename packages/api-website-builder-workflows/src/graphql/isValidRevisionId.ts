/**
 * Whether a revision id is `<entryId>#<version>` with a non-empty entry id and a numeric version
 * of at least 1 (R107). Pure; every resolver that takes a revision id checks it before
 * `parseIdentifier`, which throws on some malformed ids and passes others through.
 */
export const isValidRevisionId = (revisionId: string): boolean => {
    const parts = revisionId.split("#");
    if (parts.length !== 2) {
        return false;
    }
    const [entryId, version] = parts;
    return entryId.length > 0 && /^\d+$/.test(version) && Number(version) >= 1;
};
