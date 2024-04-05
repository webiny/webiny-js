import {
    ILockingMechanismLockEntry,
    ILockingMechanismLockEntryParams,
    ILockingMechanismLockEntryResult
} from "~/domain/abstractions/ILockingMechanismLockEntry";
import { ILockingMechanismClient } from "./abstractions/ILockingMechanismClient";

interface Params {
    client: ILockingMechanismClient;
}

export class LockingMechanismLockEntry implements ILockingMechanismLockEntry {
    private readonly client: ILockingMechanismClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        params: ILockingMechanismLockEntryParams
    ): Promise<ILockingMechanismLockEntryResult> {
        throw new Error("Method not implemented.");
    }
}
