/**
 * Packages named via `-p`. Yargs gives a string for a single occurrence and an
 * array for repeated ones, so both shapes are normalized here.
 */
export const getPackagesWhitelist = (p?: string | string[]): string[] => {
    if (!p) {
        return [];
    }

    return Array.isArray(p) ? p : [p];
};
