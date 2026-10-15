// Widgets register their column as a string ("left" or "right") or as a zero-based index.
export const toColumnIndex = (column: string | number | undefined): number => {
    if (typeof column === "number") {
        return column;
    }
    return column === "right" ? 1 : 0;
};
