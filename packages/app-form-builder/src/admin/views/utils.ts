export const serializeSorters = data => {
    if (!data) {
        return data;
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
