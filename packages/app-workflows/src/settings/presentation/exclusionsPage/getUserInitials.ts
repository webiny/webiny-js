/*
 * The avatar initials of a display name: the first letters of the first and the last word, or the
 * first two letters of a one-word name, upper-cased. An empty name has none.
 */
export const getUserInitials = (name: string): string | null => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
        return null;
    }
    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }
    const first = words[0].charAt(0);
    const last = words[words.length - 1].charAt(0);
    return `${first}${last}`.toUpperCase();
};
