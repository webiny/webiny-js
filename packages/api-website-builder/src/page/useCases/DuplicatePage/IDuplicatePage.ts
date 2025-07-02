import type { DuplicateWbPageParams, WbPage } from "~/page/page.types";

export interface IDuplicatePage {
    execute: (params: DuplicateWbPageParams) => Promise<WbPage>;
}
