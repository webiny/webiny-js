import {
    ILockingMechanismGetLockRecord,
    ILockingMechanismGetLockRecordParams,
    ILockingMechanismGetLockRecordResult
} from "~/domain/abstractions/ILockingMechanismGetLockRecord";
import { ILockingMechanismClient } from "~/domain/abstractions/ILockingMechanismClient";

interface Params {
    client: ILockingMechanismClient;
}

export class LockingMechanismGetLockRecord implements ILockingMechanismGetLockRecord {
    // eslint-disable-next-line
    private readonly client: ILockingMechanismClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        // eslint-disable-next-line
        params: ILockingMechanismGetLockRecordParams
    ): Promise<ILockingMechanismGetLockRecordResult> {
        throw new Error("Method not implemented.");
    }
}
