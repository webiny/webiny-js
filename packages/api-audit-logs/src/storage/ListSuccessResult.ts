import type {
    IStorageListSuccessResult,
    IStorageListSuccessResultMeta
} from "~/storage/abstractions/IStorage.js";
import { IAuditLog } from "./types";
import type { GenericRecord } from "@webiny/api/types.js";
import { encodeCursor } from "@webiny/db-dynamodb";

export interface IListSuccessResultParams {
    data: IAuditLog[];
    lastEvaluatedKey?: GenericRecord;
}

export class ListSuccessResult implements IStorageListSuccessResult {
    public readonly data: IAuditLog[];
    public readonly meta: IStorageListSuccessResultMeta;
    public success: true = true;

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
