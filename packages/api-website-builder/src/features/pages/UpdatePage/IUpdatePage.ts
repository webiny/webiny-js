import type { UpdateWbPageData, WbPage } from "~/context/pages/pages.types";

export interface IUpdatePage {
    execute: (id: string, data: UpdateWbPageData) => Promise<WbPage>;
}
