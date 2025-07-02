import type { UpdateWbPageData, WbPage } from "~/page/page.types";

export interface IUpdatePage {
    execute: (id: string, data: UpdateWbPageData) => Promise<WbPage>;
}
