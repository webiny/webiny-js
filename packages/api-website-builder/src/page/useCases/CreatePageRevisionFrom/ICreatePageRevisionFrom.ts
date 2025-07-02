import type { CreateWbPageRevisionFromParams, WbPage } from "~/page/page.types";

export interface ICreatePageRevisionFrom {
    execute: (params: CreateWbPageRevisionFromParams) => Promise<WbPage>;
}
