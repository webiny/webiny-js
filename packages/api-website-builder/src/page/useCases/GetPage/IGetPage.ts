import type { GetWbPageParams, WbPage } from "~/page/page.types";

export interface IGetPage {
    execute: (params: GetWbPageParams) => Promise<WbPage | null>;
}
