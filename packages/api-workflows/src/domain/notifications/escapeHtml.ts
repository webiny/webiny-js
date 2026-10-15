/**
 * Escapes the five characters that matter in HTML text and attribute values (R193). The
 * ampersand goes first so the other replacements are not escaped twice. Pure.
 */
export const escapeHtml = (value: string): string => {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};
