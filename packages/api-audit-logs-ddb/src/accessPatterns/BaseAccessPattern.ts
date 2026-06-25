import type { IAuditLog } from "@webiny/api-audit-logs/storage/types.js";
import type { IIndexStorageItem, IStorageItem } from "~/types.js";
import { createStartKey } from "~/startKey.js";
import type { IStorageListParams } from "@webiny/api-audit-logs/storage/abstractions/Storage.js";
import type {
    IAccessPattern,
    IAccessPatternCreateKeysResult,
    IAccessPatternHandles,
    IAccessPatternListResult
} from "~/abstractions/AccessPattern.js";
import type { AuditLogsEntity } from "~/entity.js";
import type { IEntityQueryAllParams } from "@webiny/db-dynamodb";
import type { GenericRecord } from "@webiny/api/types.js";

const toGteTime = (date?: Date): number => {
    if (!date) {
        return 0;
    }
    return date.getTime();
};
const toLteTime = (date?: Date): number => {
    if (!date) {
        return Date.now();
    }
    return date.getTime();
};

interface IPopulateResultInput {
    items: IIndexStorageItem[];
    lastEvaluatedKey: GenericRecord;
}

export interface ICreateOptionsParams {
    limit?: number;
    sort?: "ASC" | "DESC";
    after?: string;
    createdOn_gte?: Date;
    createdOn_lte?: Date;
}

export interface IBaseAccessPatternParams {
    index: string | undefined;
    entity: AuditLogsEntity;
}

export interface IAccessPatternQueryParams {
    partitionKey: string;
    options: IEntityQueryAllParams["options"];
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
        for (const key of handles.mustInclude) {
            if (!params[key]) {
                return false;
            }
        }
        for (const key of handles.mustNotInclude) {
            if (!!params[key]) {
                return false;
            }
        }
        if (!handles.shouldInclude?.length) {
            return true;
        }

        for (const key of handles.shouldInclude) {
            if (!!params[key]) {
                return true;
            }
        }
        return false;
    }

    protected async query<T extends IStorageItem = IStorageItem>(
        params: IAccessPatternQueryParams
    ) {
        return this.entity.queryPerPage<T>({
            partitionKey: params.partitionKey,
            options: params.options
        });
    }

    protected async populateResult(input: IPopulateResultInput): Promise<IAccessPatternListResult> {
        const reader = this.entity.createEntityReader({
            read: input.items.map(item => {
                return {
                    PK: item.PK,
                    SK: item.SK
                };
            })
        });
        const result = await reader.execute();

        return {
            ...input,
            items: input.items
                .map(item => {
                    return result.find(i => {
                        return i.PK === item.PK && i.SK === item.SK;
                    });
                })
                .filter((item): item is IStorageItem => !!item)
        };
    }

    public abstract list(params: T): Promise<IAccessPatternListResult>;
    public abstract createKeys(item: IAuditLog): IAccessPatternCreateKeysResult;

    protected createOptions(params: ICreateOptionsParams): IEntityQueryAllParams["options"] {
        const options: IEntityQueryAllParams["options"] = {
            limit: params.limit || 25,
            // @ts-expect-error
            startKey: createStartKey({
                after: params.after
            }),
            reverse: params.sort === "DESC",
            index: this.index
        };

        if (params.createdOn_lte || params.createdOn_gte) {
            options!.between = [toGteTime(params.createdOn_gte), toLteTime(params.createdOn_lte)];
        }

        return options;
    }
}
