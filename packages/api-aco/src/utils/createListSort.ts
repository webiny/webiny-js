import { ListSort } from "~/types";
import {
    CmsEntryListSort,
    CmsEntryListSortAsc,
    CmsEntryListSortDesc
} from "@webiny/api-headless-cms/types";

export const createListSort = (sort?: ListSort): CmsEntryListSort | undefined => {
    if (!sort) {
        return;
    }

    return Object.keys(sort).map(key => {
        return `${key}_${sort[key]}` as CmsEntryListSortAsc | CmsEntryListSortDesc;
    });
};
