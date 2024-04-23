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
    // @eslint-disable-next-line
    private readonly client: ILockingMechanismClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        // eslint-disable-next-line
        params: ILockingMechanismUnlockEntryRequestParams
    ): Promise<ILockingMechanismUnlockEntryRequestResult> {
        throw new Error("Method not implemented.");
    }
}
