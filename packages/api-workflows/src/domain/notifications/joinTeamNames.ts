/**
 * Joins team names for a message: "A", "A and B", "A, B and C". Blank names are left out; no
 * names gives "". Pure.
 */
export const joinTeamNames = (names: string[]): string => {
    const items = names.map(name => name.trim()).filter(name => name !== "");
    if (items.length <= 1) {
        return items[0] ?? "";
    }
    const last = items[items.length - 1];
    return `${items.slice(0, -1).join(", ")} and ${last}`;
};
