import {
    ILockingMechanismUnlockEntry,
    ILockingMechanismUnlockEntryParams,
    ILockingMechanismUnlockEntryResult
} from "~/domain/abstractions/ILockingMechanismUnlockEntry";
import { ILockingMechanismClient } from "./abstractions/ILockingMechanismClient";

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
        throw new Error("Method not implemented.");
    }
}
