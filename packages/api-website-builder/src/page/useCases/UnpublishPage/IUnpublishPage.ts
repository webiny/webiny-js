import type { UnpublishWbPageParams, WbPage } from "~/page/page.types";

export interface IUnpublishPage {
    execute: (params: UnpublishWbPageParams) => Promise<WbPage>;
}
