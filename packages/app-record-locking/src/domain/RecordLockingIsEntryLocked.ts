import type {
    IRecordLockingIsEntryLocked,
    IRecordLockingIsEntryLockedParams,
    IRecordLockingIsEntryLockedResult
} from "~/domain/abstractions/IRecordLockingIsEntryLocked.js";
import type { IRecordLockingClient } from "./abstractions/IRecordLockingClient.js";
import type {
    IRecordLockingIsEntryLockedResponse,
    IRecordLockingIsEntryLockedVariables
} from "~/domain/graphql/isEntryLocked.js";
import { IS_ENTRY_LOCKED_QUERY } from "~/domain/graphql/isEntryLocked.js";

interface Params {
    client: IRecordLockingClient;
}

export class RecordLockingIsEntryLocked implements IRecordLockingIsEntryLocked {
    private readonly client: IRecordLockingClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        params: IRecordLockingIsEntryLockedParams
    ): Promise<IRecordLockingIsEntryLockedResult> {
        try {
            const result = await this.client.query<
                IRecordLockingIsEntryLockedResponse,
                IRecordLockingIsEntryLockedVariables
            >({
                query: IS_ENTRY_LOCKED_QUERY,
                variables: params
            });
            return !!result.data?.recordLocking?.isEntryLocked?.data;
        } catch {
            return false;
        }
    }
}
