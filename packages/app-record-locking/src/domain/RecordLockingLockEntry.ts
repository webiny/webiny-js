import { WebinyError } from "@webiny/error";
import {
    IRecordLockingLockEntry,
    IRecordLockingLockEntryParams,
    IRecordLockingLockEntryResult
} from "~/domain/abstractions/IRecordLockingLockEntry";
import { IRecordLockingClient } from "./abstractions/IRecordLockingClient";

interface Params {
    client: IRecordLockingClient;
}

export class RecordLockingLockEntry implements IRecordLockingLockEntry {
    // eslint-disable-next-line
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
