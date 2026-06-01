import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntry, CmsMetaResponse, CmsModel } from "~/types.js";

// Gateway

export interface IListEntriesGatewayParams {
    model: CmsModel;
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface IListEntriesGatewayResult {
    data: CmsContentEntry[];
    meta: CmsMetaResponse;
}

export interface IListEntriesGateway {
    execute(params: IListEntriesGatewayParams): Promise<IListEntriesGatewayResult>;
}

export const ListEntriesGateway = createAbstraction<IListEntriesGateway>("ListEntriesGateway");

export namespace ListEntriesGateway {
    export type Interface = IListEntriesGateway;
}

// Repository

export interface IListEntriesRepositoryParams {
    model: CmsModel;
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface IListEntriesRepositoryResult {
    data: CmsContentEntry[];
    meta: CmsMetaResponse;
}

export interface IListEntriesRepository {
    execute(params: IListEntriesRepositoryParams): Promise<IListEntriesRepositoryResult>;
}

export const ListEntriesRepository =
    createAbstraction<IListEntriesRepository>("ListEntriesRepository");

export namespace ListEntriesRepository {
    export type Interface = IListEntriesRepository;
}

// UseCase

export interface IListEntriesUseCaseParams {
    model: CmsModel;
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface IListEntriesUseCaseResult {
    data: CmsContentEntry[];
    meta: CmsMetaResponse;
}

export interface IListEntriesUseCase {
    execute(params: IListEntriesUseCaseParams): Promise<IListEntriesUseCaseResult>;
}

export const ListEntriesUseCase = createAbstraction<IListEntriesUseCase>("ListEntriesUseCase");

export namespace ListEntriesUseCase {
    export type Interface = IListEntriesUseCase;
}
