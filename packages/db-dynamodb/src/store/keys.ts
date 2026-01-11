export interface IParams {
    key: string | number | symbol;
}

export const createPartitionKey = () => {
    return `W#internal`;
};

export const createSortKey = ({ key }: IParams) => {
    if (typeof key === "symbol") {
        return key.toString();
    }
    return String(key);
};

export const createType = () => {
    return "internal";
};
