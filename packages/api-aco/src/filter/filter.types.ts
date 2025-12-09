import type { AcoBaseFields, ListMeta, ListSort } from "~/types.js";

export enum Operation {
    AND = "AND",
    OR = "OR"
}

export interface GroupFilter {
    field: string;
    condition: string;
    value: string;
}

export interface Group {
    operation: Operation;
    filters: GroupFilter[];
}

export interface Filter extends AcoBaseFields {
    name: string;
    description?: string;
    namespace: string;
    operation: Operation;
    groups: Group[];
}

export interface ListFiltersWhere {
    namespace: string;
}

export interface ListFiltersParams {
    where: ListFiltersWhere;
    sort?: ListSort;
    limit?: number;
    after?: string | null;
}

export type CreateFilterParams = Pick<
    Filter,
    "id" | "name" | "description" | "namespace" | "operation" | "groups"
>;

export interface UpdateFilterParams {
    name?: string;
    description?: string;
    namespace?: string;
    operation?: Operation;
    groups?: Group[];
}

export interface DeleteFilterParams {
    id: string;
}

export interface StorageOperationsGetFilterParams {
    id: string;
}

export type StorageOperationsListFiltersParams = ListFiltersParams;

export interface StorageOperationsCreateFilterParams {
    data: CreateFilterParams;
}

export interface StorageOperationsUpdateFilterParams {
    id: string;
    data: UpdateFilterParams;
}

export type StorageOperationsDeleteFilterParams = DeleteFilterParams;

export interface AcoFilterCrud {
    get(id: string): Promise<Filter>;
    list(params: ListFiltersParams): Promise<[Filter[], ListMeta]>;
    create(data: CreateFilterParams): Promise<Filter>;
    update(id: string, data: UpdateFilterParams): Promise<Filter>;
    delete(id: string): Promise<boolean>;
}

export interface AcoFilterStorageOperations {
    getFilter(params: StorageOperationsGetFilterParams): Promise<Filter>;
    listFilters(params: StorageOperationsListFiltersParams): Promise<[Filter[], ListMeta]>;
    createFilter(params: StorageOperationsCreateFilterParams): Promise<Filter>;
    updateFilter(params: StorageOperationsUpdateFilterParams): Promise<Filter>;
    deleteFilter(params: StorageOperationsDeleteFilterParams): Promise<boolean>;
}
