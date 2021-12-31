import { ApwWorkflowStorageOperations } from "~/types";
import {
    baseFields,
    CreateApwStorageOperationsParams,
    getFieldValues
} from "~/storageOperations/index";

export const createWorkflowStorageOperations = ({
    cms
}: CreateApwStorageOperationsParams): ApwWorkflowStorageOperations => {
    const getWorkflowModel = () => {
        return cms.getModel("apwWorkflowModelDefinition");
    };
    const getWorkflow: ApwWorkflowStorageOperations["getWorkflow"] = async ({ id }) => {
        const model = await getWorkflowModel();
        const entry = await cms.getEntryById(model, id);
        return getFieldValues(entry, baseFields);
    };
    return {
        getWorkflowModel,
        getWorkflow,
        async listWorkflows(params) {
            const model = await getWorkflowModel();
            const [entries, meta] = await cms.listLatestEntries(model, params);
            return [entries.map(entry => getFieldValues(entry, baseFields)), meta];
        },
        async createWorkflow(params) {
            const model = await getWorkflowModel();
            const entry = await cms.createEntry(model, params.data);
            return getFieldValues(entry, baseFields);
        },
        async updateWorkflow(params) {
            const model = await getWorkflowModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await getWorkflow({ id: params.id });

            const entry = await cms.updateEntry(model, params.id, {
                ...existingEntry,
                ...params.data
            });
            return getFieldValues(entry, baseFields);
        },
        async deleteWorkflow(params) {
            const model = await getWorkflowModel();
            await cms.deleteEntry(model, params.id);
            return true;
        }
    };
};
