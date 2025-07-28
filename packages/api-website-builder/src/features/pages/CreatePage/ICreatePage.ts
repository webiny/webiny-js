import type { CreateWbPageData, WbPage } from "~/context/pages/pages.types";

export interface ICreatePage {
    execute: (data: CreateWbPageData) => Promise<WbPage>;
}
