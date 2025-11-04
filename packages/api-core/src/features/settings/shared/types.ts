import type { GenericRecord } from "@webiny/api/types";

// Domain/Application layer types (no tenant awareness)
export interface Settings<T = GenericRecord<string>> {
    name: string;
    data: T;
}

export interface IGetSettingsInput {
    name: string;
}

export interface IUpdateSettingsInput {
    name: string;
    data: GenericRecord<string>;
}

// Repository/Storage layer types (tenant-aware)
export interface SettingsStorageRecord {
    name: string;
    data: GenericRecord<string>;
    tenant: string;
}

export interface IGetSettingsStorageParams {
    name: string;
    tenant: string;
}

export interface IUpdateSettingsStorageParams {
    name: string;
    data: GenericRecord<string>;
    tenant: string;
}

export interface IDeleteSettingsStorageParams {
    name: string;
    tenant: string;
}
