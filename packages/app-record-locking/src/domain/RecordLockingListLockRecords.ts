import { WebinyError } from "@webiny/error";
import { ApolloClient } from "apollo-client";
import {
    IRecordLockingListLockRecords,
    IRecordLockingListLockRecordsParams,
    IRecordLockingListLockRecordsResult
} from "./abstractions/IRecordLockingListLockRecords";
import { IRecordLockingClient } from "./abstractions/IRecordLockingClient";
import { createRecordLockingClient } from "./utils/createRecordLockingClient";
import {
    IRecordLockingListLockedRecordsResponse,
    IRecordLockingListLockedRecordsVariables,
    LIST_LOCK_RECORDS
} from "~/domain/graphql/listLockRecords";

interface Params {
    client: IRecordLockingClient | ApolloClient<any>;
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
