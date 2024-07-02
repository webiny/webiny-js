import {
    IRecordLockingGetLockRecord,
    IRecordLockingGetLockRecordExecuteParams,
    IRecordLockingGetLockRecordExecuteResult
} from "~/domain/abstractions/IRecordLockingGetLockRecord";
import { IRecordLockingClient } from "~/domain/abstractions/IRecordLockingClient";
import {
    GET_LOCK_RECORD_QUERY,
    IRecordLockingGetLockRecordResponse,
    IRecordLockingGetLockRecordVariables
} from "~/domain/graphql/getLockRecord";
import { WebinyError } from "@webiny/error";

interface Params {
    client: IRecordLockingClient;
}

export class RecordLockingGetLockRecord implements IRecordLockingGetLockRecord {
    private readonly client: IRecordLockingClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        params: IRecordLockingGetLockRecordExecuteParams
    ): Promise<IRecordLockingGetLockRecordExecuteResult> {
        const result = await this.client.query<
            IRecordLockingGetLockRecordResponse,
            IRecordLockingGetLockRecordVariables
        >({
            query: GET_LOCK_RECORD_QUERY,
            variables: params
        });
        if (result.data.recordLocking.getLockRecord.error) {
            throw new WebinyError(result.data.recordLocking.getLockRecord.error);
        } else if (!result.data.recordLocking.getLockRecord.data) {
            throw new WebinyError("No data returned from server.");
        }
        return result.data.recordLocking.getLockRecord;
    }
}
