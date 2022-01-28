type SortTypes = "asc" | "desc";
/**
 * @deprecated
 */
export const serializeSorters = (data: string): string | undefined => {
    if (!data) {
        return data as undefined;
    }
    const [field, order] = data.split("_") as [string, SortTypes];
    return `${field}:${order.toLowerCase()}`;
};
/**
 * @param data in format field_order
 */
export const deserializeSorters = (data: string): [string, SortTypes] => {
    if (typeof data !== "string") {
        return data;
    }
    const [field, orderBy] = data.split("_") as [string, SortTypes];
    const order = String(orderBy).toLowerCase() === "asc" ? "asc" : "desc";
    return [field, order];
};
