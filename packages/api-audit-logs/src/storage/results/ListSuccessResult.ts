import type {
    IStorageListSuccessResult,
    IStorageListSuccessResultMeta
} from "~/storage/abstractions/Storage.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { encodeCursor } from "@webiny/db-dynamodb";
import type { IAuditLog } from "~/storage/types.js";

export interface IListSuccessResultParams {
    data: IAuditLog[];
    lastEvaluatedKey?: GenericRecord;
}

export class ListSuccessResult implements IStorageListSuccessResult {
    public readonly data: IAuditLog[];
    public readonly meta: IStorageListSuccessResultMeta;
    public readonly success = true;

    protected constructor(params: IListSuccessResultParams) {
        this.data = params.data;
        this.meta = {
            after: encodeCursor(params.lastEvaluatedKey) || undefined,
            hasMoreItems: !!params.lastEvaluatedKey
        };
    }

    public static create(params: IListSuccessResultParams): IStorageListSuccessResult {
        return new ListSuccessResult(params);
    }
}
