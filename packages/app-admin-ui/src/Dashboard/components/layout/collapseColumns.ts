// Folds `columns` into `count` visual columns, keeping neighbors together and reading order intact.
export const collapseColumns = (columns: string[][], count: number): string[][] => {
    const result: string[][] = Array.from({ length: count }, () => []);
    const perColumn = Math.ceil(columns.length / count);
    const groupSize = Math.max(1, perColumn);
    columns.forEach((column, index) => {
        const group = Math.floor(index / groupSize);
        const target = Math.min(group, count - 1);
        result[target].push(...column);
    });
    return result;
};
