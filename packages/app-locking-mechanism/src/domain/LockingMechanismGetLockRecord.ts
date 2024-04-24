import {
    ILockingMechanismGetLockRecord,
    ILockingMechanismGetLockRecordExecuteParams,
    ILockingMechanismGetLockRecordExecuteResult
} from "~/domain/abstractions/ILockingMechanismGetLockRecord";
import { ILockingMechanismClient } from "~/domain/abstractions/ILockingMechanismClient";
import {
    GET_LOCK_RECORD_QUERY,
    ILockingMechanismGetLockRecordResponse,
    ILockingMechanismGetLockRecordVariables
} from "~/domain/graphql/getLockRecord";
import { WebinyError } from "@webiny/error";

interface Params {
    client: ILockingMechanismClient;
}

export class LockingMechanismGetLockRecord implements ILockingMechanismGetLockRecord {
    private readonly client: ILockingMechanismClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        params: ILockingMechanismGetLockRecordExecuteParams
    ): Promise<ILockingMechanismGetLockRecordExecuteResult> {
        const result = await this.client.query<
            ILockingMechanismGetLockRecordResponse,
            ILockingMechanismGetLockRecordVariables
        >({
            query: GET_LOCK_RECORD_QUERY,
            variables: params
        });
        if (result.data.lockingMechanism.getLockRecord.error) {
            throw new WebinyError(result.data.lockingMechanism.getLockRecord.error);
        } else if (!result.data.lockingMechanism.getLockRecord.data) {
            throw new Error("No data returned from server.");
        }
        return result.data.lockingMechanism.getLockRecord;
    }
}
