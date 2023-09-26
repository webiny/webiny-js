export const isTextNode = (obj: Record<string, any>) => {
    return !obj["children"] && obj?.type === "text";
};
