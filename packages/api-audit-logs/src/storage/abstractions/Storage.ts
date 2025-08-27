import type { IAuditLog } from "~/storage/types.js";

export interface IStorageFetchParams {
    id: string;
    tenant: string;
}

export interface IStorageFetchErrorResult {
    error: Error;
    data?: never;
    success: false;
}

export interface IStorageFetchSuccessResult {
    data: IAuditLog;
    success: true;
    error?: never;
}

export type IStorageFetchResult = IStorageFetchErrorResult | IStorageFetchSuccessResult;

export interface IStorageStoreParams {
    data: IAuditLog;
}

export interface IStorageStoreErrorResult {
    error: Error;
    data?: never;
    success: false;
}

export interface IStorageStoreSuccessResult {
    data: IAuditLog;
    success: true;
    error?: never;
}

export type IStorageStoreResult = IStorageStoreErrorResult | IStorageStoreSuccessResult;

// PK / SK
export interface IStorageListDefaultParams {
    tenant: string;
    sort?: "ASC" | "DESC";
    after?: string;
    limit: number | undefined;

    app?: never;
    createdBy?: never;
    action?: never;
    entryId?: never;
    version?: never;
}

// GSI1_PK / GSI1_SK
export interface IStorageListByAppParams {
    tenant: string;
    app: string;
    after?: string;
    sort?: "ASC" | "DESC";
    createdOn_gte?: Date;
    createdOn_lte?: Date;
    limit: number | undefined;

    createdBy?: never;
    action?: never;
    entryId?: never;
    version?: never;
}

// GSI2_PK / GSI2_SK
export interface IStorageListByAppAndActionParams {
    tenant: string;
    app: string;
    action: string;
    after?: string;
    sort?: "ASC" | "DESC";
    createdOn_gte?: Date;
    createdOn_lte?: Date;
    limit: number | undefined;

    createdBy?: never;
    entryId?: never;
    version?: never;
}

// GSI3_PK / GSI3_SK
export interface IStorageListByCreatedByParams {
    tenant: string;
    createdBy: string;
    after?: string;
    sort?: "ASC" | "DESC";
    createdOn_gte?: Date;
    createdOn_lte?: Date;
    limit: number | undefined;

    app?: never;
    action?: never;
    entryId?: never;
    version?: never;
}

// GSI4_PK / GSI4_SK
export interface IStorageListByCreatedOnParams {
    tenant: string;
    createdOn_gte: Date;
    createdOn_lte: Date;
    after?: string;
    sort?: "ASC" | "DESC";
    limit: number | undefined;

    app?: never;
    createdBy?: never;
    action?: never;
    entryId?: never;
    version?: never;
}

// GSI5_PK / GSI5_SK
export interface IStorageListByAppAndTargetParams {
    tenant: string;
    app: string;
    entryId: string;
    after?: string;
    sort?: "ASC" | "DESC";
    version?: never;
    createdOn_gte?: Date;
    createdOn_lte?: Date;
    limit: number | undefined;

    createdBy?: never;
    action?: never;
}

export type IStorageListParams =
    | IStorageListByAppParams
    | IStorageListByCreatedByParams
    | IStorageListByCreatedOnParams
    | IStorageListByAppAndActionParams
    | IStorageListByAppAndTargetParams;

export interface IStorageListSuccessResultMeta {
    after?: string;
    hasMoreItems: boolean;
}

export interface IStorageListSuccessResult {
    data: IAuditLog[];
    meta: IStorageListSuccessResultMeta;
    success: true;
    error?: never;
}

export interface IStorageListErrorResult {
    error: Error;
    data?: never;
    meta?: never;
    success: false;
}

export type IStorageListResult = IStorageListErrorResult | IStorageListSuccessResult;

export interface IStorage {
    fetch(params: IStorageFetchParams): Promise<IStorageFetchResult>;
    store(params: IStorageStoreParams): Promise<IStorageStoreResult>;
    list(params: IStorageListParams): Promise<IStorageListResult>;
}
