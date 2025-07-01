import { createTopic } from "@webiny/pubsub";
import type { WebsiteBuilderConfig } from "~/types";
import type {
    OnWebsiteBuilderPageAfterCreateTopicParams,
    OnWebsiteBuilderPageAfterDeleteTopicParams,
    OnWebsiteBuilderPageAfterUpdateTopicParams,
    OnWebsiteBuilderPageBeforeCreateTopicParams,
    OnWebsiteBuilderPageBeforeDeleteTopicParams,
    OnWebsiteBuilderPageBeforeUpdateTopicParams,
    WbPageCrud
} from "~/page/page.types";

export const createPagesCrud = (config: WebsiteBuilderConfig): WbPageCrud => {
    // create
    const onWebsiteBuilderPageBeforeCreate =
        createTopic<OnWebsiteBuilderPageBeforeCreateTopicParams>("wb.onPageBeforeCreate");
    const onWebsiteBuilderPageAfterCreate =
        createTopic<OnWebsiteBuilderPageAfterCreateTopicParams>("wb.onPageAfterCreate");
    // update
    const onWebsiteBuilderPageBeforeUpdate =
        createTopic<OnWebsiteBuilderPageBeforeUpdateTopicParams>("wb.onPageBeforeUpdate");
    const onWebsiteBuilderPageAfterUpdate =
        createTopic<OnWebsiteBuilderPageAfterUpdateTopicParams>("wb.onPageAfterUpdate");
    // delete
    const onWebsiteBuilderPageBeforeDelete =
        createTopic<OnWebsiteBuilderPageBeforeDeleteTopicParams>("wb.onPageBeforeDelete");
    const onWebsiteBuilderPageAfterDelete =
        createTopic<OnWebsiteBuilderPageAfterDeleteTopicParams>("wb.onPageAfterDelete");

    console.log("config", config);

    return {
        onWebsiteBuilderPageBeforeCreate,
        onWebsiteBuilderPageAfterCreate,
        onWebsiteBuilderPageBeforeUpdate,
        onWebsiteBuilderPageAfterUpdate,
        onWebsiteBuilderPageBeforeDelete,
        onWebsiteBuilderPageAfterDelete,

        // Define the CRUD operations for pages here
        create: async () => {
            // Implementation for creating a page
        },
        get: async () => {
            // Implementation for retrieving a page by ID
        },
        update: async () => {
            // Implementation for updating a page by ID
        },
        delete: async () => {
            // Implementation for deleting a page by ID
        },
        list: async () => {
            // Implementation for listing pages with optional parameters
        }
    };
};
