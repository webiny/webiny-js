import { DeleteModelOperations } from "@webiny/api-headless-cms-tasks/graphql/deleteModel/abstractions.js";
import {
    DeleteCmsModelTaskStatus,
    type IDeleteCmsModelTask,
    type IStoreValue
} from "@webiny/api-headless-cms-tasks/features/DeleteModelTask/types.js";

/**
 * Stands in for the background-task implementation (not registered in this package's harness), so
 * tests see whether `fullyDeleteModel` reached it. Register with
 * `container.registerInstance(DeleteModelOperations, operations)`; decorators still apply.
 */
export class RecordingDeleteModelOperations implements DeleteModelOperations.Interface {
    public readonly fullyDeleted: string[] = [];

    public async listModelsBeingDeleted(): Promise<IStoreValue[]> {
        return [];
    }

    public async isModelBeingDeleted(): Promise<boolean> {
        return false;
    }

    public async fullyDeleteModel(modelId: string): Promise<IDeleteCmsModelTask> {
        this.fullyDeleted.push(modelId);
        return { id: "task-1", status: DeleteCmsModelTaskStatus.RUNNING, total: 0, deleted: 0 };
    }

    public async cancelFullyDeleteModel(): Promise<IDeleteCmsModelTask> {
        return { id: "task-1", status: DeleteCmsModelTaskStatus.CANCELED, total: 0, deleted: 0 };
    }

    public async getDeleteModelProgress(): Promise<IDeleteCmsModelTask> {
        return { id: "task-1", status: DeleteCmsModelTaskStatus.RUNNING, total: 0, deleted: 0 };
    }
}
