import type { DuplicateWbPageParams, WbPage } from "~/context/pages/pages.types";

export interface IDuplicatePage {
    execute: (params: DuplicateWbPageParams) => Promise<WbPage>;
}
