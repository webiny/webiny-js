import { createTopic } from "@webiny/pubsub";
import {
    getCreateRedirectUseCase,
    getDeleteRedirectUseCase,
    getListRedirectsUseCase,
    getUpdateRedirectUseCase,
    getMoveRedirectUseCase,
    getGetRedirectByIdUseCase
} from "~/features/redirects";
import {
    OnRedirectAfterCreateTopicParams,
    OnRedirectAfterDeleteTopicParams,
    OnRedirectAfterMoveTopicParams,
    OnRedirectAfterUpdateTopicParams,
    OnRedirectBeforeCreateTopicParams,
    OnRedirectBeforeDeleteTopicParams,
    OnRedirectBeforeMoveTopicParams,
    OnRedirectBeforeUpdateTopicParams,
    UpdateWbRedirectData,
    WbRedirectCrud,
    WbRedirectsStorageOperations
} from "~/context/redirects/redirects.types";
import type { WebsiteBuilderConfig } from "~/context/types";

export const createRedirectsCrud = (
    config: WebsiteBuilderConfig<WbRedirectsStorageOperations>
): WbRedirectCrud => {
    // create
    const onRedirectBeforeCreate = createTopic<OnRedirectBeforeCreateTopicParams>(
        "wb.onRedirectBeforeCreate"
    );
    const onRedirectAfterCreate = createTopic<OnRedirectAfterCreateTopicParams>(
        "wb.onRedirectAfterCreate"
    );

    const { createRedirectUseCase } = getCreateRedirectUseCase({
        createOperation: config.storageOperations.create,
        topics: {
            onRedirectBeforeCreate,
            onRedirectAfterCreate
        }
    });

    // update
    const onRedirectBeforeUpdate = createTopic<OnRedirectBeforeUpdateTopicParams>(
        "wb.onRedirectBeforeUpdate"
    );
    const onRedirectAfterUpdate = createTopic<OnRedirectAfterUpdateTopicParams>(
        "wb.onRedirectAfterUpdate"
    );

    const { updateRedirectUseCase } = getUpdateRedirectUseCase({
        updateOperation: config.storageOperations.update,
        getOperation: config.storageOperations.getById,
        topics: {
            onRedirectBeforeUpdate,
            onRedirectAfterUpdate
        }
    });

    // move
    const onRedirectBeforeMove =
        createTopic<OnRedirectBeforeMoveTopicParams>("wb.onRedirectBeforeMove");
    const onRedirectAfterMove =
        createTopic<OnRedirectAfterMoveTopicParams>("wb.onRedirectAfterMove");

    const { moveRedirectUseCase } = getMoveRedirectUseCase({
        moveOperation: config.storageOperations.move,
        getOperation: config.storageOperations.getById,
        topics: {
            onRedirectBeforeMove,
            onRedirectAfterMove
        }
    });

    // delete
    const onRedirectBeforeDelete = createTopic<OnRedirectBeforeDeleteTopicParams>(
        "wb.onRedirectBeforeDelete"
    );
    const onRedirectAfterDelete = createTopic<OnRedirectAfterDeleteTopicParams>(
        "wb.onRedirectAfterDelete"
    );

    const { deleteRedirectUseCase } = getDeleteRedirectUseCase({
        deleteOperation: config.storageOperations.delete,
        getOperation: config.storageOperations.getById,
        topics: {
            onRedirectBeforeDelete,
            onRedirectAfterDelete
        }
    });

    // get by id
    const { getRedirectByIdUseCase } = getGetRedirectByIdUseCase({
        getOperation: config.storageOperations.getById
    });

    // list
    const { listRedirectsUseCase } = getListRedirectsUseCase({
        listOperation: config.storageOperations.list
    });

    return {
        onRedirectBeforeCreate,
        onRedirectAfterCreate,
        onRedirectBeforeUpdate,
        onRedirectAfterUpdate,
        onRedirectBeforeMove,
        onRedirectAfterMove,
        onRedirectBeforeDelete,
        onRedirectAfterDelete,

        list: async params => {
            return listRedirectsUseCase.execute(params);
        },
        getById: async id => {
            return getRedirectByIdUseCase.execute(id);
        },
        create: async data => {
            return createRedirectUseCase.execute(data);
        },
        update: async (id: string, data: UpdateWbRedirectData) => {
            return updateRedirectUseCase.execute(id, data);
        },
        move: async params => {
            return moveRedirectUseCase.execute(params);
        },
        delete: async params => {
            return deleteRedirectUseCase.execute(params);
        }
    };
};
