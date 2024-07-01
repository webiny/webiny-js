import { WebinyError } from "@webiny/error";
import {
    IRecordLockingUpdateEntryLock,
    IRecordLockingUpdateEntryLockExecuteParams,
    IRecordLockingUpdateEntryLockExecuteResult
} from "~/domain/abstractions/IRecordLockingUpdateEntryLock";
import { IRecordLockingClient } from "~/domain/abstractions/IRecordLockingClient";
import {
    IRecordLockingUpdateEntryLockResponse,
    IRecordLockingUpdateEntryLockVariables,
    UPDATE_ENTRY_LOCK
} from "~/domain/graphql/updateEntryLock";

interface Params {
    client: IRecordLockingClient;
}

export class RecordLockingUpdateEntryLock implements IRecordLockingUpdateEntryLock {
    private readonly client: IRecordLockingClient;

    public constructor(params: Params) {
        this.client = params.client;
    }

    public async execute(
        params: IRecordLockingUpdateEntryLockExecuteParams
    ): Promise<IRecordLockingUpdateEntryLockExecuteResult> {
        const result = await this.client.mutation<
            IRecordLockingUpdateEntryLockResponse,
            IRecordLockingUpdateEntryLockVariables
        >({
            mutation: UPDATE_ENTRY_LOCK,
            variables: params
        });
        if (!result.data?.recordLocking?.updateEntryLock) {
            throw new WebinyError("No data returned from server.");
        }
        return result.data.recordLocking.updateEntryLock;
    }
}
