import {
    ILockingMechanismUpdateEntryLock,
    ILockingMechanismUpdateEntryLockExecuteParams,
    ILockingMechanismUpdateEntryLockExecuteResult
} from "~/domain/abstractions/ILockingMechanismUpdateEntryLock";
import { ILockingMechanismClient } from "~/domain/abstractions/ILockingMechanismClient";
import {
    ILockingMechanismUpdateEntryLockResponse,
    ILockingMechanismUpdateEntryLockVariables,
    UPDATE_ENTRY_LOCK
} from "~/domain/graphql/updateEntryLock";

interface Params {
    client: ILockingMechanismClient;
}

export class LockingMechanismUpdateEntryLock implements ILockingMechanismUpdateEntryLock {
    private readonly client: ILockingMechanismClient;

    public constructor(params: Params) {
        this.client = params.client;
    }

    public async execute(
        params: ILockingMechanismUpdateEntryLockExecuteParams
    ): Promise<ILockingMechanismUpdateEntryLockExecuteResult> {
        const result = await this.client.mutation<
            ILockingMechanismUpdateEntryLockResponse,
            ILockingMechanismUpdateEntryLockVariables
        >({
            mutation: UPDATE_ENTRY_LOCK,
            variables: {
                id: params.id,
                type: params.type
            }
        });
        if (!result.data?.lockingMechanism?.updateEntryLock?.data) {
            throw new Error("No data returned from server.");
        }
        return result.data.lockingMechanism.updateEntryLock;
    }
}
