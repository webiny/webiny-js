import type { CmsEntryListSort, CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { WbRedirect } from "~/context/redirects/redirects.types";

export interface ListWbRedirectsParams {
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

export interface IListRedirects {
    execute: (params: ListWbRedirectsParams) => Promise<[WbRedirect[], WbListMeta]>;
}
