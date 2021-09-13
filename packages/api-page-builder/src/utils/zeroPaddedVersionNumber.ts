export const getZeroPaddedVersionNumber = (value: string | number): string => {
    if (typeof value !== "number") {
        value = Number(value);
    }
    return String(value).padStart(4, "0");
};
