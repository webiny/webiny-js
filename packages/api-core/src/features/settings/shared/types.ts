import type { GenericRecord } from "@webiny/api/types";

// Domain/Application layer types (no tenant awareness)
export interface Settings<T = GenericRecord<string>> {
    name: string;
    data: T;
}

export interface GetSettingsInput {
    name: string;
}

export interface UpdateSettingsInput {
    name: string;
    data: GenericRecord<string>;
}

// Repository/Storage layer types (tenant-aware)
export interface SettingsStorageRecord {
    name: string;
    data: GenericRecord<string>;
    tenant: string;
}

export interface GetSettingsStorageParams {
    name: string;
    tenant: string;
}

export interface UpdateSettingsStorageParams {
    name: string;
    data: GenericRecord<string>;
    tenant: string;
}

export interface DeleteSettingsStorageParams {
    name: string;
    tenant: string;
}
