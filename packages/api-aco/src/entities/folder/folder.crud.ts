import { createTopic } from "@webiny/pubsub";

import { CreateAcoParams } from "~/types";
import {
    AcoFolderCrud,
    OnFolderAfterCreateTopicParams,
    OnFolderAfterDeleteTopicParams,
    OnFolderAfterUpdateTopicParams,
    OnFolderBeforeCreateTopicParams,
    OnFolderBeforeDeleteTopicParams,
    OnFolderBeforeUpdateTopicParams
} from "./folder.types";

export const createFolderCrudMethods = ({ storageOperations }: CreateAcoParams): AcoFolderCrud => {
    // create
    const onFolderBeforeCreate = createTopic<OnFolderBeforeCreateTopicParams>(
        "aco.onFolderBeforeCreate"
    );
    const onFolderAfterCreate =
        createTopic<OnFolderAfterCreateTopicParams>("aco.onFolderAfterCreate");
    // update
    const onFolderBeforeUpdate = createTopic<OnFolderBeforeUpdateTopicParams>(
        "aco.onFolderBeforeUpdate"
    );
    const onFolderAfterUpdate =
        createTopic<OnFolderAfterUpdateTopicParams>("aco.onFolderAfterUpdate");
    // delete
    const onFolderBeforeDelete = createTopic<OnFolderBeforeDeleteTopicParams>(
        "aco.onFolderBeforeDelete"
    );
    const onFolderAfterDelete =
        createTopic<OnFolderAfterDeleteTopicParams>("aco.onFolderAfterDelete");

    return {
        /**
         * Lifecycle events
         */
        onFolderBeforeCreate,
        onFolderAfterCreate,
        onFolderBeforeUpdate,
        onFolderAfterUpdate,
        onFolderBeforeDelete,
        onFolderAfterDelete,
        async get(id) {
            return storageOperations.getFolder({ id });
        },
        async list(params) {
            return storageOperations.listFolders(params);
        },
        async create(data) {
            await onFolderBeforeCreate.publish({ input: data });
            const folder = await storageOperations.createFolder({ data });
            await onFolderAfterCreate.publish({ folder });
            return folder;
        },
        async update(id, data) {
            const original = await storageOperations.getFolder({ id });
            await onFolderBeforeUpdate.publish({ original, input: { id, data } });
            const folder = await storageOperations.updateFolder({ id, data });
            await onFolderAfterUpdate.publish({ original, input: { id, data }, folder });
            return folder;
        },
        async delete(id: string) {
            const folder = await storageOperations.getFolder({ id });
            await onFolderBeforeDelete.publish({ folder });
            await storageOperations.deleteFolder({ id });
            await onFolderAfterDelete.publish({ folder });
            return true;
        }
    };
};
