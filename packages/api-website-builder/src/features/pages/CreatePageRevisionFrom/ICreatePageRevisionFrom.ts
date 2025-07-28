import type { CreateWbPageRevisionFromParams, WbPage } from "~/context/pages/pages.types";

export interface ICreatePageRevisionFrom {
    execute: (params: CreateWbPageRevisionFromParams) => Promise<WbPage>;
}
