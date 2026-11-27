/*
 * Team names as a sentence part: "A", "A and B", "A, B and C". Empty for no names. Pure.
 */
export const joinTeamNames = (names: string[]): string => {
    if (names.length <= 1) {
        return names.join("");
    }
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
};
