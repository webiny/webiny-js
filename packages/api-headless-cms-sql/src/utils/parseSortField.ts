const VALUES_PREFIX = "values_";

const stripValuesPrefix = (fieldId: string): string => {
    if (fieldId.startsWith(VALUES_PREFIX)) {
        return fieldId.slice(VALUES_PREFIX.length);
    }
    return fieldId;
};

export const parseSortField = (sortField: string): [string, "asc" | "desc"] => {
    if (sortField.endsWith("_ASC")) {
        return [stripValuesPrefix(sortField.slice(0, -4)), "asc"];
    }

    if (sortField.endsWith("_DESC")) {
        return [stripValuesPrefix(sortField.slice(0, -5)), "desc"];
    }

    return [stripValuesPrefix(sortField), "asc"];
};
