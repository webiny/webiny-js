import { WebinyError } from "@webiny/error";
import type {
    IRecordLockingLockEntry,
    IRecordLockingLockEntryParams,
    IRecordLockingLockEntryResult
} from "~/domain/abstractions/IRecordLockingLockEntry.js";
import type { IRecordLockingClient } from "./abstractions/IRecordLockingClient.js";

interface Params {
    client: IRecordLockingClient;
}

export class RecordLockingLockEntry implements IRecordLockingLockEntry {
     
    private readonly client: IRecordLockingClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        // eslint-disable-next-line
        params: IRecordLockingLockEntryParams
    ): Promise<IRecordLockingLockEntryResult> {
        throw new WebinyError("Method not implemented.");
    }
}
