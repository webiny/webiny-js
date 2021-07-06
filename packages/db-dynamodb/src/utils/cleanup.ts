const attributesToRemove = ["PK", "SK", "created", "_ct", "modified", "_mt", "entity", "_et"];

export const cleanupItem = <T>(item?: T & Record<string, any>): T | null => {
    if (!item) {
        return null;
    }
    const newItem = {
        ...item
    };
    for (const attr of attributesToRemove) {
        delete newItem[attr];
    }
    return newItem;
};

export const cleanupItems = <T>(items: (T & Record<string, any>)[]): T[] => {
    return items.map(item => cleanupItem<T>(item));
};
