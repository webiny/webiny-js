type TItem = Record<string, any>;

export const paginateBatch = async <T = TItem>(
    items: T[],
    perPage: number,
    execute: (items: T[]) => Promise<any>
) => {
    const pages = Math.ceil(items.length / perPage);
    for (let i = 0; i < pages; i++) {
        await execute(items.slice(i * perPage, i * perPage + perPage));
    }
};
