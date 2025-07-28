import type { PublishWbPageParams, WbPage } from "~/context/pages/pages.types";

export interface IPublishPage {
    execute: (params: PublishWbPageParams) => Promise<WbPage>;
}
