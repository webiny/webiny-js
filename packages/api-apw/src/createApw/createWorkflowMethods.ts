import { ApwWorkflowCrud, CreateApwParams } from "~/types";

export function createWorkflowMethods({ storageOperations }: CreateApwParams): ApwWorkflowCrud {
    return {
        async getModel() {
            return await storageOperations.getWorkflowModel();
        },
        async get(id) {
            return await storageOperations.getWorkflow({ id });
        },
        async list(params) {
            return await storageOperations.listWorkflows(params);
        },
        async create(data) {
            return await storageOperations.createWorkflow({ data });
        },
        async update(id, data) {
            return await storageOperations.updateWorkflow({ id, data });
        },
        async delete(id: string) {
            await storageOperations.deleteWorkflow({ id });
            return true;
        }
    };
}
