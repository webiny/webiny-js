import {
    ILockingMechanismUnlockEntryRequest,
    ILockingMechanismUnlockEntryRequestParams,
    ILockingMechanismUnlockEntryRequestResult
} from "~/domain/abstractions/ILockingMechanismUnlockEntryRequest";
import { ILockingMechanismClient } from "./abstractions/ILockingMechanismClient";

interface Params {
    client: ILockingMechanismClient;
}

export class LockingMechanismUnlockEntryRequest implements ILockingMechanismUnlockEntryRequest {
    private readonly client: ILockingMechanismClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        params: ILockingMechanismUnlockEntryRequestParams
    ): Promise<ILockingMechanismUnlockEntryRequestResult> {
        throw new Error("Method not implemented.");
    }
}
