import type { AuditLogValues } from "~/types.js";

export interface IStorageFetchParams {
    id: string;
}

export interface IStorageFetchErrorResult {
    error: Error;
    data?: never;
    success: false;
}

export interface IStorageFetchSuccessResult {
    data: AuditLogValues;
    success: true;
    error?: never;
}

export type IStorageFetchResult = IStorageFetchErrorResult | IStorageFetchSuccessResult;

export interface IStorageStoreParams {
    data: AuditLogValues;
}

export interface IStorageStoreErrorResult {
    error: Error;
    data?: never;
    success: false;
}

export interface IStorageStoreSuccessResult {
    data: AuditLogValues;
    success: true;
    error?: never;
}

export type IStorageStoreResult = IStorageStoreErrorResult | IStorageStoreSuccessResult;

export interface IStorageListParams {
    type?: string;
    userId?: string;
    limit?: number;
    after?: string;
}

export interface IStorageListSuccessResultMeta {
    after?: string;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface IStorageListSuccessResult {
    data: AuditLogValues[];
    meta: IStorageListSuccessResultMeta;
    success: true;
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
