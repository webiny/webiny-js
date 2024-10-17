import { ITaskResponseResult } from "@webiny/tasks";
import { IDataSynchronizationManager, IDynamoDbSyncParams, ISynchronization } from "../types";

export class DynamoDbSynchronization implements ISynchronization {
    private readonly manager: IDataSynchronizationManager;

    public constructor(params: IDynamoDbSyncParams) {
        this.manager = params.manager;
    }

    public async run(): Promise<ITaskResponseResult> {
        return this.manager.response.error(new Error("Not implemented"));
    }
}
