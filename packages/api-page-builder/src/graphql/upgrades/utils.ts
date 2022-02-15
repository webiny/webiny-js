/**
 * Not used anymore
 */
// @ts-nocheck
export const paginateBatch = async (items, perPage, execute) => {
    const pages = Math.ceil(items.length / perPage);

    for (let i = 0; i < pages; i++) {
        await execute(items.slice(i * perPage, i * perPage + perPage));
    }
};
