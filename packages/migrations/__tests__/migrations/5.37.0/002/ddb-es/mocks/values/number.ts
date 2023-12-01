export const createNumberValue = (start = 0, max = 10000): number => {
    return start + Math.round(Math.random() * max);
};
