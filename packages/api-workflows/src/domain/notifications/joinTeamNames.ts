/** How many team names a message names before it counts the rest (B34). */
const NAMED_TEAMS = 2;

/**
 * Joins team names for a message (B34): "A", "A and B", and from three on the first two names
 * and the count of the rest, "A, B and 2 more". Blank names are left out; no names gives "".
 * Pure.
 */
export const joinTeamNames = (names: string[]): string => {
    const items = names.map(name => name.trim()).filter(name => name !== "");
    if (items.length <= 1) {
        return items[0] ?? "";
    }
    if (items.length === NAMED_TEAMS) {
        return `${items[0]} and ${items[1]}`;
    }
    const rest = items.length - NAMED_TEAMS;
    return `${items.slice(0, NAMED_TEAMS).join(", ")} and ${rest} more`;
};
