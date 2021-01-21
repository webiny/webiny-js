export const serializeSorters = data => {
    if (!data) {
        return data;
    }
    const [[key, value]] = Object.entries(data);
    return `${key}:${value}`;
};

export const deserializeSorters = (data: string) => {
    if (typeof data !== "string") {
        return data;
    }

    const [key, value] = data.split(":");
    return { [key]: value };
};
