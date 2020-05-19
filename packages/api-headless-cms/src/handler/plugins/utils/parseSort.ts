export type Sorter = {
    fieldId: string;
    direction: number;
};

export const parseSort = (model, sort): Sorter[] => {
    if (!sort) {
        return [];
    }

    return sort.reduce((acc, item) => {
        const [key, dir] = item.split("_");

        acc.push({
            fieldId: key,
            direction: dir === "ASC" ? 1 : -1
        });

        return acc;
    }, []);
};
