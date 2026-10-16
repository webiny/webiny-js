// The local midnight of the date's day, as a timestamp.
export const startOfDay = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};
