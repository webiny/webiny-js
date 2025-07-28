import type { CmsEntryListSort, CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { WbPage } from "~/context/pages/pages.types";

export interface ListWbPagesParams {
    where: CmsEntryListWhere;
    sort: CmsEntryListSort;
    limit: number;
    after: string | null;
    search?: string;
}

export interface WbListMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor: string | null;
}

export interface IListPages {
    execute: (params: ListWbPagesParams) => Promise<[WbPage[], WbListMeta]>;
}
