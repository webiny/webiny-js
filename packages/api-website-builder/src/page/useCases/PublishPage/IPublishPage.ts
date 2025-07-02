import type { PublishWbPageParams, WbPage } from "~/page/page.types";

export interface IPublishPage {
    execute: (params: PublishWbPageParams) => Promise<WbPage>;
}
