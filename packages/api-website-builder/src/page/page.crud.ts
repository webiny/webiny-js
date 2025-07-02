import { createTopic } from "@webiny/pubsub";
import {
    getCreatePageUseCase,
    getDeletePageUseCase,
    getGetPageUseCase,
    getListPagesUseCase,
    getUpdatePagerUseCase
} from "~/page/useCases";
import type {
    OnWebsiteBuilderPageAfterCreateTopicParams,
    OnWebsiteBuilderPageAfterDeleteTopicParams,
    OnWebsiteBuilderPageAfterUpdateTopicParams,
    OnWebsiteBuilderPageBeforeCreateTopicParams,
    OnWebsiteBuilderPageBeforeDeleteTopicParams,
    OnWebsiteBuilderPageBeforeUpdateTopicParams,
    UpdateWbPageData,
    WbPageCrud
} from "~/page/page.types";
import type { WebsiteBuilderConfig } from "~/types";

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

    const { createPageUseCase } = getCreatePageUseCase({
        createOperation: config.storageOperations.pages.create,
        topics: {
            onWebsiteBuilderPageBeforeCreate,
            onWebsiteBuilderPageAfterCreate
        }
    });

    const { updatePageUseCase } = getUpdatePagerUseCase({
        updateOperation: config.storageOperations.pages.update,
        getOperation: config.storageOperations.pages.get,
        topics: {
            onWebsiteBuilderPageBeforeUpdate,
            onWebsiteBuilderPageAfterUpdate
        }
    });

    const { deletePageUseCase } = getDeletePageUseCase({
        deleteOperation: config.storageOperations.pages.delete,
        getOperation: config.storageOperations.pages.get,
        topics: {
            onWebsiteBuilderPageBeforeDelete,
            onWebsiteBuilderPageAfterDelete
        }
    });

    const { getPageUseCase } = getGetPageUseCase({
        getOperation: config.storageOperations.pages.get
    });

    const { listPagesUseCase } = getListPagesUseCase({
        listOperation: config.storageOperations.pages.list
    });

    return {
        onWebsiteBuilderPageBeforeCreate,
        onWebsiteBuilderPageAfterCreate,
        onWebsiteBuilderPageBeforeUpdate,
        onWebsiteBuilderPageAfterUpdate,
        onWebsiteBuilderPageBeforeDelete,
        onWebsiteBuilderPageAfterDelete,

        list: async params => {
            return listPagesUseCase.execute(params);
        },
        get: async params => {
            return getPageUseCase.execute(params);
        },
        create: async data => {
            return createPageUseCase.execute(data);
        },
        update: async (id: string, data: UpdateWbPageData) => {
            return updatePageUseCase.execute(id, data);
        },
        delete: async params => {
            return deletePageUseCase.execute(params);
        }
    };
};
