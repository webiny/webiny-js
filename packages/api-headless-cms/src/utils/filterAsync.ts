export const filterAsync = async <T = Record<string, any>>(
    items: T[],
    predicate: (param: T) => Promise<boolean>
): Promise<T[]> => {
    const filteredItems = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const valid = await predicate(item);
        if (valid) {
            filteredItems.push(item);
        }
    }

    return filteredItems;
};
