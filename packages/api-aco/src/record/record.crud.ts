import { createTopic } from "@webiny/pubsub";

import { CreateAcoParams } from "~/types";
import {
    AcoSearchRecordCrud,
    OnSearchRecordAfterCreateTopicParams,
    OnSearchRecordAfterDeleteTopicParams,
    OnSearchRecordAfterUpdateTopicParams,
    OnSearchRecordBeforeCreateTopicParams,
    OnSearchRecordBeforeDeleteTopicParams,
    OnSearchRecordBeforeUpdateTopicParams
} from "./record.types";

export const createSearchRecordCrudMethods = ({
    storageOperations
}: CreateAcoParams): AcoSearchRecordCrud => {
    // create
    const onSearchRecordBeforeCreate = createTopic<OnSearchRecordBeforeCreateTopicParams>(
        "aco.onSearchRecordBeforeCreate"
    );
    const onSearchRecordAfterCreate = createTopic<OnSearchRecordAfterCreateTopicParams>(
        "aco.onSearchRecordAfterCreate"
    );
    // update
    const onSearchRecordBeforeUpdate = createTopic<OnSearchRecordBeforeUpdateTopicParams>(
        "aco.onSearchRecordBeforeUpdate"
    );
    const onSearchRecordAfterUpdate = createTopic<OnSearchRecordAfterUpdateTopicParams>(
        "aco.onSearchRecordAfterUpdate"
    );
    // delete
    const onSearchRecordBeforeDelete = createTopic<OnSearchRecordBeforeDeleteTopicParams>(
        "aco.onSearchRecordBeforeDelete"
    );
    const onSearchRecordAfterDelete = createTopic<OnSearchRecordAfterDeleteTopicParams>(
        "aco.onSearchRecordAfterDelete"
    );

    return {
        /**
         * Lifecycle events
         */
        onSearchRecordBeforeCreate,
        onSearchRecordAfterCreate,
        onSearchRecordBeforeUpdate,
        onSearchRecordAfterUpdate,
        onSearchRecordBeforeDelete,
        onSearchRecordAfterDelete,
        async get(id) {
            return storageOperations.getRecord({ id });
        },
        async list(params) {
            return storageOperations.listRecords(params);
        },
        async create(data) {
            await onSearchRecordBeforeCreate.publish({ input: data });
            const record = await storageOperations.createRecord({ data });
            await onSearchRecordAfterCreate.publish({ record });
            return record;
        },
        async update(id, data) {
            const original = await storageOperations.getRecord({ id });
            await onSearchRecordBeforeUpdate.publish({ original, input: { id, data } });
            const record = await storageOperations.updateRecord({ id, data });
            await onSearchRecordAfterUpdate.publish({ original, input: { id, data }, record });
            return record;
        },
        async delete(id: string) {
            const record = await storageOperations.getRecord({ id });
            await onSearchRecordBeforeDelete.publish({ record });
            await storageOperations.deleteRecord({ id });
            await onSearchRecordAfterDelete.publish({ record });
            return true;
        }
    };
};
