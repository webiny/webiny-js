import { createTopic } from "@webiny/pubsub";
import {
    getCreatePageUseCase,
    getDeletePageUseCase,
    getDuplicatePageUseCase,
    getGetPageUseCase,
    getListPagesUseCase,
    getUpdatePagerUseCase
} from "~/page/useCases";
import type {
    OnWebsiteBuilderPageAfterCreateTopicParams,
    OnWebsiteBuilderPageAfterDeleteTopicParams,
    OnWebsiteBuilderPageAfterDuplicateTopicParams,
    OnWebsiteBuilderPageAfterUpdateTopicParams,
    OnWebsiteBuilderPageBeforeCreateTopicParams,
    OnWebsiteBuilderPageBeforeDeleteTopicParams,
    OnWebsiteBuilderPageBeforeDuplicateTopicParams,
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

    const { createPageUseCase } = getCreatePageUseCase({
        createOperation: config.storageOperations.pages.create,
        topics: {
            onWebsiteBuilderPageBeforeCreate,
            onWebsiteBuilderPageAfterCreate
        }
    });

    // update
    const onWebsiteBuilderPageBeforeUpdate =
        createTopic<OnWebsiteBuilderPageBeforeUpdateTopicParams>("wb.onPageBeforeUpdate");
    const onWebsiteBuilderPageAfterUpdate =
        createTopic<OnWebsiteBuilderPageAfterUpdateTopicParams>("wb.onPageAfterUpdate");

    const { updatePageUseCase } = getUpdatePagerUseCase({
        updateOperation: config.storageOperations.pages.update,
        getOperation: config.storageOperations.pages.get,
        topics: {
            onWebsiteBuilderPageBeforeUpdate,
            onWebsiteBuilderPageAfterUpdate
        }
    });

    // duplicate
    const onWebsiteBuilderPageBeforeDuplicate =
        createTopic<OnWebsiteBuilderPageBeforeDuplicateTopicParams>("wb.onPageBeforeDuplicate");
    const onWebsiteBuilderPageAfterDuplicate =
        createTopic<OnWebsiteBuilderPageAfterDuplicateTopicParams>("wb.onPageAfterDuplicate");

    const { duplicatePageUseCase } = getDuplicatePageUseCase({
        createOperation: config.storageOperations.pages.create,
        getOperation: config.storageOperations.pages.get,
        topics: {
            onWebsiteBuilderPageBeforeDuplicate,
            onWebsiteBuilderPageAfterDuplicate
        }
    });

    // delete
    const onWebsiteBuilderPageBeforeDelete =
        createTopic<OnWebsiteBuilderPageBeforeDeleteTopicParams>("wb.onPageBeforeDelete");
    const onWebsiteBuilderPageAfterDelete =
        createTopic<OnWebsiteBuilderPageAfterDeleteTopicParams>("wb.onPageAfterDelete");

    const { deletePageUseCase } = getDeletePageUseCase({
        deleteOperation: config.storageOperations.pages.delete,
        getOperation: config.storageOperations.pages.get,
        topics: {
            onWebsiteBuilderPageBeforeDelete,
            onWebsiteBuilderPageAfterDelete
        }
    });

    // get
    const { getPageUseCase } = getGetPageUseCase({
        getOperation: config.storageOperations.pages.get
    });

    // list
    const { listPagesUseCase } = getListPagesUseCase({
        listOperation: config.storageOperations.pages.list
    });

    return {
        onWebsiteBuilderPageBeforeCreate,
        onWebsiteBuilderPageAfterCreate,
        onWebsiteBuilderPageBeforeUpdate,
        onWebsiteBuilderPageAfterUpdate,
        onWebsiteBuilderPageBeforeDuplicate,
        onWebsiteBuilderPageAfterDuplicate,
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
        duplicate: async params => {
            return duplicatePageUseCase.execute(params);
        },
        delete: async params => {
            return deletePageUseCase.execute(params);
        }
    };
};
