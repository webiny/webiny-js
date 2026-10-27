/**
 * The error field of a step config problem that a schema found (R267): `config.<path>` with the
 * zod issue path joined by dots (array indexes are path parts), or `config` when the issue has no
 * path.
 */
export const getConfigIssueField = (path: readonly PropertyKey[]): string => {
    if (path.length === 0) {
        return "config";
    }
    return `config.${path.map(String).join(".")}`;
};
