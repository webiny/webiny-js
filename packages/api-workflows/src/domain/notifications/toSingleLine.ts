/**
 * Collapses every CR, LF and run of whitespace to one space and trims (R193). The mail subject
 * holds user content (content and step titles), so a line break in it must not become a header.
 * Pure.
 */
export const toSingleLine = (value: string): string => {
    return value.replace(/\s+/g, " ").trim();
};
