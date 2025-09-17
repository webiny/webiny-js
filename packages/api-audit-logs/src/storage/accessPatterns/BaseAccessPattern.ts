import type {IAuditLog} from "~/storage/types.js";
import type {Entity, EntityQueryOptions} from "@webiny/db-dynamodb/toolbox.js";
import {createStartKey} from "~/storage/startKey.js";
import type {IStorageListParams} from "../abstractions/Storage.js";
import type {
    IAccessPattern,
    IAccessPatternCreateKeysResult,
    IAccessPatternHandles,
    IAccessPatternListResult
} from "../abstractions/AccessPattern.js";

const toGteTime = (date?: Date): number => {
    if(!date) {
        return 0;
    }
    return date.getTime();
};
const toLteTime = (date?: Date): number => {
    if(!date) {
        return Date.now();
    }
    return date.getTime();
};

export interface ICreateOptionsParams {
    limit?: number;
    sort?: "ASC" | "DESC";
    after?: string;
    // sortKey?: string | number;
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
    
    public abstract handles(): IAccessPatternHandles;
    
    public canHandle(params: IStorageListParams): boolean {
        const handles = this.handles();
        for(const key of handles.mustInclude) {
            if(!params[key]) {
                return false;
            }
        }
        for(const key of handles.mustNotInclude) {
            if(!!params[key]) {
                return false;
            }
        }
        return true;
    }
    public abstract list(params: T): Promise<IAccessPatternListResult>;
    public abstract createKeys(item: IAuditLog): IAccessPatternCreateKeysResult;

    protected createOptions(params: ICreateOptionsParams): EntityQueryOptions {
        const options: EntityQueryOptions = {
            limit: params.limit || 25,
            startKey: createStartKey({
                after: params.after
            }),
            reverse: params.sort === "DESC",
            index: this.index
        };
        
        if(params.createdOn_lte || params.createdOn_gte) {
            options.between = [toGteTime(params.createdOn_gte), toLteTime(params.createdOn_lte)];
        }

        return options;
    }
}
