import { WebinyError } from "@webiny/error";
import type { ApolloClient } from "@apollo/client";
import type {
    IRecordLockingListLockRecords,
    IRecordLockingListLockRecordsParams,
    IRecordLockingListLockRecordsResult
} from "./abstractions/IRecordLockingListLockRecords.js";
import type { IRecordLockingClient } from "./abstractions/IRecordLockingClient.js";
import { createRecordLockingClient } from "./utils/createRecordLockingClient.js";
import type {
    IRecordLockingListLockedRecordsResponse,
    IRecordLockingListLockedRecordsVariables
} from "~/domain/graphql/listLockRecords.js";
import { LIST_LOCK_RECORDS } from "~/domain/graphql/listLockRecords.js";

interface Params {
    client: IRecordLockingClient | ApolloClient;
}

export class RecordLockingListLockRecords implements IRecordLockingListLockRecords {
    private readonly client: IRecordLockingClient;

    public constructor(params: Params) {
        this.client = createRecordLockingClient(params.client);
    }
    public async execute(
        params: IRecordLockingListLockRecordsParams
    ): Promise<IRecordLockingListLockRecordsResult> {
        const { where, sort, limit, after } = params;

        const result = await this.client.query<
            IRecordLockingListLockedRecordsResponse,
            IRecordLockingListLockedRecordsVariables
        >({
            query: LIST_LOCK_RECORDS,
            variables: {
                where,
                sort,
                limit,
                after
            }
        });
        if (!result.data?.recordLocking?.listLockRecords) {
            throw new WebinyError("No data returned from server.");
        }
        return result.data.recordLocking.listLockRecords;
    }
}
