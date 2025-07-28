import { createTopic } from "@webiny/pubsub";
import {
    getCreatePageRevisionFromUseCase,
    getCreatePageUseCase,
    getDeletePageUseCase,
    getDuplicatePageUseCase,
    getGetPageByPathUseCase,
    getListPagesUseCase,
    getPublishPageUseCase,
    getUnpublishPageUseCase,
    getUpdatePagerUseCase
} from "~/features/pages";
import {
    OnPageAfterCreateRevisionFromTopicParams,
    OnPageAfterCreateTopicParams,
    OnPageAfterDeleteTopicParams,
    OnPageAfterDuplicateTopicParams,
    OnPageAfterMoveTopicParams,
    OnPageAfterPublishTopicParams,
    OnPageAfterUnpublishTopicParams,
    OnPageAfterUpdateTopicParams,
    OnPageBeforeCreateRevisionFromTopicParams,
    OnPageBeforeCreateTopicParams,
    OnPageBeforeDeleteTopicParams,
    OnPageBeforeDuplicateTopicParams,
    OnPageBeforeMoveTopicParams,
    OnPageBeforePublishTopicParams,
    OnPageBeforeUnpublishTopicParams,
    OnPageBeforeUpdateTopicParams,
    UpdateWbPageData,
    WbPageCrud,
    WbPagesStorageOperations
} from "~/context/pages/pages.types";
import type { WebsiteBuilderConfig } from "~/context/types";
import { getMovePageUseCase } from "~/features/pages/MovePage";
import { getGetPageByIdUseCase } from "~/features/pages/GetPageById";
import { getGetPageRevisionsUseCase } from "~/features/pages/GetPageRevisions";

export const createPagesCrud = (
    config: WebsiteBuilderConfig<WbPagesStorageOperations>
): WbPageCrud => {
    // create
    const onPageBeforeCreate = createTopic<OnPageBeforeCreateTopicParams>("wb.onPageBeforeCreate");
    const onPageAfterCreate = createTopic<OnPageAfterCreateTopicParams>("wb.onPageAfterCreate");

    const { createPageUseCase } = getCreatePageUseCase({
        createOperation: config.storageOperations.create,
        topics: {
            onPageBeforeCreate,
            onPageAfterCreate
        }
    });

    // update
    const onPageBeforeUpdate = createTopic<OnPageBeforeUpdateTopicParams>("wb.onPageBeforeUpdate");
    const onPageAfterUpdate = createTopic<OnPageAfterUpdateTopicParams>("wb.onPageAfterUpdate");

    const { updatePageUseCase } = getUpdatePagerUseCase({
        updateOperation: config.storageOperations.update,
        getOperation: config.storageOperations.getById,
        topics: {
            onPageBeforeUpdate,
            onPageAfterUpdate
        }
    });

    // publish
    const onPageBeforePublish =
        createTopic<OnPageBeforePublishTopicParams>("wb.onPageBeforePublish");
    const onPageAfterPublish = createTopic<OnPageAfterPublishTopicParams>("wb.onPageAfterPublish");

    const { publishPageUseCase } = getPublishPageUseCase({
        publishOperation: config.storageOperations.publish,
        getOperation: config.storageOperations.getById,
        topics: {
            onPageBeforePublish,
            onPageAfterPublish
        }
    });

    // unpublish
    const onPageBeforeUnpublish = createTopic<OnPageBeforeUnpublishTopicParams>(
        "wb.onPageBeforeUnpublish"
    );
    const onPageAfterUnpublish =
        createTopic<OnPageAfterUnpublishTopicParams>("wb.onPageAfterUnpublish");

    const { unpublishPageUseCase } = getUnpublishPageUseCase({
        unpublishOperation: config.storageOperations.unpublish,
        getOperation: config.storageOperations.getById,
        topics: {
            onPageBeforeUnpublish,
            onPageAfterUnpublish
        }
    });

    // duplicate
    const onPageBeforeDuplicate = createTopic<OnPageBeforeDuplicateTopicParams>(
        "wb.onPageBeforeDuplicate"
    );
    const onPageAfterDuplicate =
        createTopic<OnPageAfterDuplicateTopicParams>("wb.onPageAfterDuplicate");

    const { duplicatePageUseCase } = getDuplicatePageUseCase({
        createOperation: config.storageOperations.create,
        getOperation: config.storageOperations.getById,
        topics: {
            onPageBeforeDuplicate,
            onPageAfterDuplicate
        }
    });

    // move
    const onPageBeforeMove = createTopic<OnPageBeforeMoveTopicParams>("wb.onPageBeforeMove");
    const onPageAfterMove = createTopic<OnPageAfterMoveTopicParams>("wb.onPageAfterMove");

    const { movePageUseCase } = getMovePageUseCase({
        moveOperation: config.storageOperations.move,
        getOperation: config.storageOperations.getById,
        topics: {
            onPageBeforeMove,
            onPageAfterMove
        }
    });

    // create page revision from
    const onPageBeforeCreateRevisionFrom = createTopic<OnPageBeforeCreateRevisionFromTopicParams>(
        "wb.onPageBeforeCreateRevisionFrom"
    );
    const onPageAfterCreateRevisionFrom = createTopic<OnPageAfterCreateRevisionFromTopicParams>(
        "wb.onPageAfterCreateRevisionFrom"
    );

    const { createPageRevisionFromUseCase } = getCreatePageRevisionFromUseCase({
        createRevisionFromOperation: config.storageOperations.createRevisionFrom,
        getOperation: config.storageOperations.getById,
        topics: {
            onPageBeforeCreateRevisionFrom,
            onPageAfterCreateRevisionFrom
        }
    });

    // delete
    const onPageBeforeDelete = createTopic<OnPageBeforeDeleteTopicParams>("wb.onPageBeforeDelete");
    const onPageAfterDelete = createTopic<OnPageAfterDeleteTopicParams>("wb.onPageAfterDelete");

    const { deletePageUseCase } = getDeletePageUseCase({
        deleteOperation: config.storageOperations.delete,
        getOperation: config.storageOperations.getById,
        topics: {
            onPageBeforeDelete,
            onPageAfterDelete
        }
    });

    // get by path
    const { getPageByPathUseCase } = getGetPageByPathUseCase({
        getOperation: config.storageOperations.get
    });

    // get by id
    const { getPageByIdUseCase } = getGetPageByIdUseCase({
        getOperation: config.storageOperations.getById
    });

    // get page revisions
    const { getPageRevisionsUseCase } = getGetPageRevisionsUseCase({
        getRevisions: config.storageOperations.getRevisions
    });

    // list
    const { listPagesUseCase } = getListPagesUseCase({
        listOperation: config.storageOperations.list
    });

    return {
        onPageBeforeCreate,
        onPageAfterCreate,
        onPageBeforeUpdate,
        onPageAfterUpdate,
        onPageBeforePublish,
        onPageAfterPublish,
        onPageBeforeUnpublish,
        onPageAfterUnpublish,
        onPageBeforeDuplicate,
        onPageAfterDuplicate,
        onPageBeforeMove,
        onPageAfterMove,
        onPageBeforeCreateRevisionFrom,
        onPageAfterCreateRevisionFrom,
        onPageBeforeDelete,
        onPageAfterDelete,

        list: async params => {
            return listPagesUseCase.execute(params);
        },
        getById: async id => {
            return getPageByIdUseCase.execute(id);
        },
        getByPath: async path => {
            return getPageByPathUseCase.execute(path);
        },
        getPageRevisions: async (entryId: string) => {
            return getPageRevisionsUseCase.execute(entryId);
        },
        create: async data => {
            return createPageUseCase.execute(data);
        },
        update: async (id: string, data: UpdateWbPageData) => {
            return updatePageUseCase.execute(id, data);
        },
        publish: async params => {
            return publishPageUseCase.execute(params);
        },
        unpublish: async params => {
            return unpublishPageUseCase.execute(params);
        },
        duplicate: async params => {
            return duplicatePageUseCase.execute(params);
        },
        move: async params => {
            return movePageUseCase.execute(params);
        },
        createRevisionFrom(params) {
            return createPageRevisionFromUseCase.execute(params);
        },
        delete: async params => {
            return deletePageUseCase.execute(params);
        }
    };
};
