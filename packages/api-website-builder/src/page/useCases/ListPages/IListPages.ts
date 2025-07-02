import type { ListWbPagesParams, WbPage } from "~/page/page.types";
import type { WbListMeta } from "~/types";

export interface IListPages {
    execute: (params: ListWbPagesParams) => Promise<[WbPage[], WbListMeta]>;
}
