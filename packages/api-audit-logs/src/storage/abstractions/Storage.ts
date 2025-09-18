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
    entityId?: never;
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

    entity?: never;
    createdBy?: never;
    action?: never;
    entityId?: never;
}

// GSI2_PK / GSI2_SK
export interface IStorageListByAppCreatedByParams
    extends Omit<IStorageListByAppParams, "createdBy"> {
    createdBy: string;
}

// GSI3_PK / GSI3_SK
export interface IStorageListByAppEntityParams extends Omit<IStorageListByAppParams, "entity"> {
    entity: string;
}
// GSI4_PK / GSI4_SK
export interface IStorageListByEntityIdParams extends Omit<IStorageListByAppParams, "entityId"> {
    entityId: string;
}
// GSI5_PK / GSI5_SK
export interface IStorageListByActionParams extends Omit<IStorageListByAppParams, "action"> {
    action: string;
}

// GSI6_PK / GSI6_SK
export interface IStorageListByAppEntityActionCreatedByParams
    extends Omit<IStorageListByAppParams, "action" | "entity" | "createdBy"> {
    createdBy: string;
    entity: string;
    action: string;
}
// GSI7_PK / GSI7_SK
export interface IStorageListByAppEntityActionParams
    extends Omit<IStorageListByAppParams, "entity" | "action"> {
    entity: string;
    action: string;
}
// GSI8_PK / GSI8_SK
export interface IStorageListByAppEntityCreatedByParams
    extends Omit<IStorageListByAppParams, "createdBy" | "entity"> {
    createdBy: string;
    entity: string;
}

// GSI9_PK / GSI9_SK
export interface IStorageListByCreatedByParams extends Omit<IStorageListByAppParams, "createdBy"> {
    createdBy: string;
}

// GSI10_PK / GSI10_SK
export interface IStorageListByCreatedOnParams extends IStorageListByAppParams {
    createdOn_gte?: Date;
    createdOn_lte?: Date;
}

export type IStorageListParams =
    | IStorageListByAppParams
    | IStorageListByAppCreatedByParams
    | IStorageListByAppEntityParams
    | IStorageListByEntityIdParams
    | IStorageListByActionParams
    | IStorageListByAppEntityActionCreatedByParams
    | IStorageListByAppEntityActionParams
    | IStorageListByAppEntityCreatedByParams
    | IStorageListByCreatedByParams
    | IStorageListByCreatedOnParams;

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
