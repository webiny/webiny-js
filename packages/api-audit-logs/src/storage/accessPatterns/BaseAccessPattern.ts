import type { IAuditLog } from "~/storage/types.js";
import type { Entity, EntityQueryOptions } from "@webiny/db-dynamodb/toolbox.js";
import { createStartKey } from "~/storage/startKey.js";
import type { IStorageListParams } from "../abstractions/Storage.js";
import type {
    IAccessPattern,
    IAccessPatternCreateKeysResult,
    IAccessPatternListResult
} from "../abstractions/AccessPattern.js";

export interface ICreateOptionsParams {
    limit: number | undefined;
    sort: "ASC" | "DESC" | undefined;
    after: string | undefined;
    sortKey: string | number | undefined;
    createdOn_gte?: Date;
    createdOn_lte?: Date;
}

export interface IBaseAccessPatternParams {
    index: string | undefined;
    entity: Entity;
}

export abstract class BaseAccessPattern<T> implements IAccessPattern<T> {
    public readonly index;
    protected readonly entity;

    public constructor(params: IBaseAccessPatternParams) {
        this.index = params.index;
        this.entity = params.entity;
    }

    public abstract canHandle(params: IStorageListParams): boolean;
    public abstract list(params: T): Promise<IAccessPatternListResult>;
    public abstract createKeys(item: IAuditLog): IAccessPatternCreateKeysResult;

    protected createOptions(params: ICreateOptionsParams): EntityQueryOptions {
        const options: EntityQueryOptions = {
            limit: params.limit || 25,
            startKey: createStartKey({
                after: params.after
            }),
            reverse: params.sort === "DESC" ? true : false,
            index: this.index
        };
        if (params.createdOn_gte) {
            options.gte = params.createdOn_gte.getTime();
        } else if (params.createdOn_lte) {
            options.lte = params.createdOn_lte.getTime();
        }

        return options;
    }
}
