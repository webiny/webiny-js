import type {
    IRecordLockingGetLockRecord,
    IRecordLockingGetLockRecordExecuteParams,
    IRecordLockingGetLockRecordExecuteResult
} from "~/domain/abstractions/IRecordLockingGetLockRecord.js";
import type { IRecordLockingClient } from "~/domain/abstractions/IRecordLockingClient.js";
import type {
    IRecordLockingGetLockRecordResponse,
    IRecordLockingGetLockRecordVariables
} from "~/domain/graphql/getLockRecord.js";
import { GET_LOCK_RECORD_QUERY } from "~/domain/graphql/getLockRecord.js";
import { WebinyError } from "@webiny/error";

interface Params {
    client: IRecordLockingClient;
}

export class RecordLockingGetLockRecord implements IRecordLockingGetLockRecord {
    private readonly client: IRecordLockingClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        params: IRecordLockingGetLockRecordExecuteParams
    ): Promise<IRecordLockingGetLockRecordExecuteResult> {
        const result = await this.client.query<
            IRecordLockingGetLockRecordResponse,
            IRecordLockingGetLockRecordVariables
        >({
            query: GET_LOCK_RECORD_QUERY,
            variables: params
        });
        if (!result.data?.recordLocking?.getLockRecord) {
            throw new WebinyError("Missing response data.", "MISSING_RESPONSE_DATA", {
                response: result
            });
        } else if (result.data.recordLocking.getLockRecord.error) {
            throw new WebinyError(result.data.recordLocking.getLockRecord.error);
        } else if (!result.data.recordLocking.getLockRecord.data) {
            throw new WebinyError("No data returned from server.");
        }
        return result.data.recordLocking.getLockRecord;
    }
}
