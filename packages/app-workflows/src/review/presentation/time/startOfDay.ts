// The local midnight of the date's day, as a timestamp.
export const startOfDay = (date: Date): number => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const midnight = new Date(year, month, day);
    return midnight.getTime();
};
