import { IRecordLockingClient } from "~/domain/abstractions/IRecordLockingClient";
import {
    GET_LOCKED_ENTRY_LOCK_RECORD_QUERY,
    IRecordLockingGetLockedEntryLockRecordResponse,
    IRecordLockingGetLockedEntryLockRecordVariables
} from "~/domain/graphql/getLockedEntryLockRecord";
import { WebinyError } from "@webiny/error";
import {
    IRecordLockingGetLockedEntryLockRecord,
    IRecordLockingGetLockedEntryLockRecordExecuteParams,
    IRecordLockingGetLockedEntryLockRecordExecuteResult
} from "~/domain/abstractions/IRecordLockingGetLockedEntryLockRecord";

interface Params {
    client: IRecordLockingClient;
}

export class RecordLockingGetLockedEntryLockRecord
    implements IRecordLockingGetLockedEntryLockRecord
{
    private readonly client: IRecordLockingClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        params: IRecordLockingGetLockedEntryLockRecordExecuteParams
    ): Promise<IRecordLockingGetLockedEntryLockRecordExecuteResult> {
        const result = await this.client.query<
            IRecordLockingGetLockedEntryLockRecordResponse,
            IRecordLockingGetLockedEntryLockRecordVariables
        >({
            query: GET_LOCKED_ENTRY_LOCK_RECORD_QUERY,
            variables: params
        });
        if (result.data.recordLocking.getLockedEntryLockRecord.error) {
            throw new WebinyError(result.data.recordLocking.getLockedEntryLockRecord.error);
        }
        return result.data.recordLocking.getLockedEntryLockRecord;
    }
}
