import { createAbstraction } from "@webiny/feature/admin";
import type { FmFile } from "../shared/types.js";
import type { FmListMeta } from "@webiny/sdk";

// Gateway — performs the API call via @webiny/sdk.
export interface IListFilesGateway {
    execute(params: ListFilesGatewayParams): Promise<ListFilesGatewayResult>;
}

export interface ListFilesGatewayParams {
    search?: string;
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
}

export interface ListFilesGatewayResult {
    data: FmFile[];
    meta: FmListMeta;
}

export const ListFilesGateway = createAbstraction<IListFilesGateway>("ListFilesGateway");

export namespace ListFilesGateway {
    export type Interface = IListFilesGateway;
}

// Repository — manages cached file list state and delegates I/O to the gateway.
export interface IListFilesRepository {
    execute(params: ListFilesGatewayParams): Promise<ListFilesGatewayResult>;
}

export const ListFilesRepository = createAbstraction<IListFilesRepository>("ListFilesRepository");

export namespace ListFilesRepository {
    export type Interface = IListFilesRepository;
}

// UseCase — orchestrates a single list-files operation.
export interface ListFilesUseCaseParams {
    search?: string;
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
}

export interface ListFilesUseCaseResult {
    data: FmFile[];
    meta: FmListMeta;
}

export interface IListFilesUseCase {
    execute(params: ListFilesUseCaseParams): Promise<ListFilesUseCaseResult>;
}

export const ListFilesUseCase = createAbstraction<IListFilesUseCase>("ListFilesUseCase");

export namespace ListFilesUseCase {
    export type Interface = IListFilesUseCase;
}
