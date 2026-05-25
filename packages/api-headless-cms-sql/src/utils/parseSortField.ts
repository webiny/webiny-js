export const parseSortField = (sortField: string): [string, "asc" | "desc"] => {
    if (sortField.endsWith("_ASC")) {
        return [sortField.slice(0, -4), "asc"];
    }

    if (sortField.endsWith("_DESC")) {
        return [sortField.slice(0, -5), "desc"];
    }

    return [sortField, "asc"];
};
