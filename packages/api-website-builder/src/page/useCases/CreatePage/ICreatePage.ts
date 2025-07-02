import type { CreateWbPageData, WbPage } from "~/page/page.types";

export interface ICreatePage {
    execute: (data: CreateWbPageData) => Promise<WbPage>;
}
