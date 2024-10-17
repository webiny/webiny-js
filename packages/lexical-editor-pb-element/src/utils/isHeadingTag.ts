export const isHeadingTag = (
    tagValue: string | [string, Record<string, any>] | undefined
): boolean => {
    const tagName = Array.isArray(tagValue) ? tagValue[0] : tagValue;
    return tagName?.toLowerCase().includes("h") ?? false;
};
