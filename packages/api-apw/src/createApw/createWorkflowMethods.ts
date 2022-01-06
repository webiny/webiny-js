import { ApwWorkflowCrud, CreateApwParams } from "~/types";

export function createWorkflowMethods({ storageOperations }: CreateApwParams): ApwWorkflowCrud {
    return {
        async getModel() {
            return storageOperations.getWorkflowModel();
        },
        async get(id) {
            return storageOperations.getWorkflow({ id });
        },
        async list(params) {
            return storageOperations.listWorkflows(params);
        },
        async create(data) {
            return storageOperations.createWorkflow({ data });
        },
        async update(id, data) {
            return storageOperations.updateWorkflow({ id, data });
        },
        async delete(id: string) {
            await storageOperations.deleteWorkflow({ id });
            return true;
        }
    };
}
