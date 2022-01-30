/**
 * @deprecated
 */
export const serializeSorters = (data: Record<string, string>): string | undefined => {
    if (!data) {
        return data as undefined;
    }
    const [[key, value]] = Object.entries(data);
    return `${key}:${value}`;
};

export const deserializeSorters = (data: string): Record<string, "asc" | "desc" | boolean> => {
    if (typeof data !== "string") {
        return data;
    }

    const [key, value] = data.split(":") as [string, "asc" | "desc" | boolean];
    return { [key]: value };
};
