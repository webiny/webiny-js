import { WebinyError } from "@webiny/error";
import {
    IRecordLockingUnlockEntryRequest,
    IRecordLockingUnlockEntryRequestParams,
    IRecordLockingUnlockEntryRequestResult
} from "~/domain/abstractions/IRecordLockingUnlockEntryRequest";
import { IRecordLockingClient } from "./abstractions/IRecordLockingClient";

interface Params {
    client: IRecordLockingClient;
}

export class RecordLockingUnlockEntryRequest implements IRecordLockingUnlockEntryRequest {
    // @eslint-disable-next-line
    private readonly client: IRecordLockingClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        // eslint-disable-next-line
        params: IRecordLockingUnlockEntryRequestParams
    ): Promise<IRecordLockingUnlockEntryRequestResult> {
        throw new WebinyError("Method not implemented.");
    }
}
