import { WebinyError } from "@webiny/error";
import {
    ILockingMechanismUnlockEntry,
    ILockingMechanismUnlockEntryParams,
    ILockingMechanismUnlockEntryResult
} from "~/domain/abstractions/ILockingMechanismUnlockEntry";
import { ILockingMechanismClient } from "./abstractions/ILockingMechanismClient";
import {
    ILockingMechanismUnlockEntryResponse,
    ILockingMechanismUnlockEntryVariables,
    UNLOCK_ENTRY_MUTATION
} from "~/domain/graphql/unlockEntry";

interface Params {
    client: ILockingMechanismClient;
}

export class LockingMechanismUnlockEntry implements ILockingMechanismUnlockEntry {
    private readonly client: ILockingMechanismClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        params: ILockingMechanismUnlockEntryParams
    ): Promise<ILockingMechanismUnlockEntryResult> {
        const result = await this.client.mutation<
            ILockingMechanismUnlockEntryResponse,
            ILockingMechanismUnlockEntryVariables
        >({
            mutation: UNLOCK_ENTRY_MUTATION,
            variables: params
        });
        if (!result.data?.lockingMechanism?.unlockEntry) {
            throw new WebinyError("No data returned from server.");
        }
        return result.data.lockingMechanism.unlockEntry;
    }
}
