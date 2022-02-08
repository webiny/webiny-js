type SortTypes = "asc" | "desc";
export const deserializeSorters = (data: string): [string, SortTypes] => {
    if (typeof data !== "string") {
        return data;
    }
    const [field, orderBy] = data.split("_") as [string, SortTypes];
    const order = String(orderBy).toLowerCase() === "asc" ? "asc" : "desc";
    return [field, order];
};
