export const filterAsync = async <T = Record<string, any>>(
    items: T[],
    predicate: (param: T) => Promise<boolean>
): Promise<T[]> => {
    const filteredItems = await Promise.all(
        items.map(async item => {
            const valid = await predicate(item);
            if (!valid) {
                return null;
            }
            return item;
        })
    );

    return filteredItems.filter(Boolean) as T[];
};
