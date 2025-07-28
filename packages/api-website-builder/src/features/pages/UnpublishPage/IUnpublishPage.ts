import type { UnpublishWbPageParams, WbPage } from "~/context/pages/pages.types";

export interface IUnpublishPage {
    execute: (params: UnpublishWbPageParams) => Promise<WbPage>;
}
