import {
    ILockingMechanismIsEntryLocked,
    ILockingMechanismIsEntryLockedParams,
    ILockingMechanismIsEntryLockedResult
} from "~/domain/abstractions/ILockingMechanismIsEntryLocked";
import { ILockingMechanismClient } from "./abstractions/ILockingMechanismClient";

interface Params {
    client: ILockingMechanismClient;
}

export class LockingMechanismIsEntryLocked implements ILockingMechanismIsEntryLocked {
    private readonly client: ILockingMechanismClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        params: ILockingMechanismIsEntryLockedParams
    ): Promise<ILockingMechanismIsEntryLockedResult> {
        throw new Error("Method not implemented.");
    }
}
