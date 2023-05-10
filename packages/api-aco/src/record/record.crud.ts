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
        async get(model, id) {
            return storageOperations.getRecord(model, { id });
        },
        async list(model, params) {
            return storageOperations.listRecords(model, params);
        },
        async create(model, data) {
            await onSearchRecordBeforeCreate.publish({ model, input: data });
            const record = await storageOperations.createRecord(model, { data });
            await onSearchRecordAfterCreate.publish({ model, record });
            return record;
        },
        async update(model, id, data) {
            const original = await storageOperations.getRecord(model, { id });
            await onSearchRecordBeforeUpdate.publish({ model, original, input: { id, data } });
            const record = await storageOperations.updateRecord(model, { id, data });
            await onSearchRecordAfterUpdate.publish({
                model,
                original,
                input: { id, data },
                record
            });
            return record;
        },
        async delete(model, id: string) {
            const record = await storageOperations.getRecord(model, { id });
            await onSearchRecordBeforeDelete.publish({ model, record });
            await storageOperations.deleteRecord(model, { id });
            await onSearchRecordAfterDelete.publish({ model, record });
            return true;
        }
    };
};
