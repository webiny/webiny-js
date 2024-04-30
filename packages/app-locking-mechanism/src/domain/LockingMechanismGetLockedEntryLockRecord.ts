import { ILockingMechanismClient } from "~/domain/abstractions/ILockingMechanismClient";
import {
    GET_LOCKED_ENTRY_LOCK_RECORD_QUERY,
    ILockingMechanismGetLockedEntryLockRecordResponse,
    ILockingMechanismGetLockedEntryLockRecordVariables
} from "~/domain/graphql/getLockedEntryLockRecord";
import { WebinyError } from "@webiny/error";
import {
    ILockingMechanismGetLockedEntryLockRecord,
    ILockingMechanismGetLockedEntryLockRecordExecuteParams,
    ILockingMechanismGetLockedEntryLockRecordExecuteResult
} from "~/domain/abstractions/ILockingMechanismGetLockedEntryLockRecord";

interface Params {
    client: ILockingMechanismClient;
}

export class LockingMechanismGetLockedEntryLockRecord
    implements ILockingMechanismGetLockedEntryLockRecord
{
    private readonly client: ILockingMechanismClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        params: ILockingMechanismGetLockedEntryLockRecordExecuteParams
    ): Promise<ILockingMechanismGetLockedEntryLockRecordExecuteResult> {
        const result = await this.client.query<
            ILockingMechanismGetLockedEntryLockRecordResponse,
            ILockingMechanismGetLockedEntryLockRecordVariables
        >({
            query: GET_LOCKED_ENTRY_LOCK_RECORD_QUERY,
            variables: params
        });
        if (result.data.lockingMechanism.getLockedEntryLockRecord.error) {
            throw new WebinyError(result.data.lockingMechanism.getLockedEntryLockRecord.error);
        }
        return result.data.lockingMechanism.getLockedEntryLockRecord;
    }
}
