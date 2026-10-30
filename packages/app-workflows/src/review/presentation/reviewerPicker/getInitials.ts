/*
 * The avatar initials of a display name: the first letters of its first two words, upper case.
 */
export const getInitials = (displayName: string): string => {
    const words = displayName.trim().split(/\s+/).filter(Boolean);
    return words
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join("");
};
