const pad = (value: number): string => {
    return String(value).padStart(2, "0");
};
export const createTimeValue = () => {
    const date = new Date();
    return [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(":");
};
