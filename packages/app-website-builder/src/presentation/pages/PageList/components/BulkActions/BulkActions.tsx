export const getPagesLabel = (count = 0): string => {
    return `${count} ${count === 1 ? "page" : "pages"}`;
};
