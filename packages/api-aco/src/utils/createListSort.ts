import { ListSort } from "~/types";

export const createListSort = (sort?: ListSort): string[] | undefined => {
    if (!sort) {
        return;
    }

    return Object.keys(sort).map(key => `${key}_${sort[key]}`);
};
