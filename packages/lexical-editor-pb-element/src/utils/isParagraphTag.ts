export const isParagraphTag = (tagValue: string | [string, Record<string, any>]): boolean => {
    const tagName = Array.isArray(tagValue) ? tagValue[0] : tagValue;
    return tagName.toLowerCase().includes("p");
};
