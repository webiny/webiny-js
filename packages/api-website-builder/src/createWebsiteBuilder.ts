import type { WebsiteBuilderConfig, WebsiteBuilderContextObject } from "~/types";
import { createPagesCrud } from "~/page/page.crud";

export const createWebsiteBuilder = (config: WebsiteBuilderConfig): WebsiteBuilderContextObject => {
    const pagesCrud = createPagesCrud(config);

    return {
        page: pagesCrud
    };
};
