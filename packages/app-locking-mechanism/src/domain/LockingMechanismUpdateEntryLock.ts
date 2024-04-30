import { WebinyError } from "@webiny/error";
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
            variables: params
        });
        if (!result.data?.lockingMechanism?.updateEntryLock) {
            throw new WebinyError("No data returned from server.");
        }
        return result.data.lockingMechanism.updateEntryLock;
    }
}
