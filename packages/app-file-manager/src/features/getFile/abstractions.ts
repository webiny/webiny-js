import { createAbstraction } from "@webiny/feature/admin";
import type { FmFile } from "../shared/types.js";

// Gateway — performs the API call via @webiny/sdk.
export interface IGetFileGateway {
    execute(params: GetFileGatewayParams): Promise<FmFile>;
}

export interface GetFileGatewayParams {
    id: string;
}

export const GetFileGateway = createAbstraction<IGetFileGateway>("GetFileGateway");

export namespace GetFileGateway {
    export type Interface = IGetFileGateway;
}

// Repository — delegates I/O to the gateway and updates the shared cache.
export interface IGetFileRepository {
    execute(params: GetFileGatewayParams): Promise<FmFile>;
}

export const GetFileRepository = createAbstraction<IGetFileRepository>("GetFileRepository");

export namespace GetFileRepository {
    export type Interface = IGetFileRepository;
}

// UseCase — orchestrates a single get-file operation.
export interface GetFileUseCaseParams {
    id: string;
}

export type GetFileUseCaseResult =
    | { success: true; file: FmFile }
    | { success: false; error: { code: string; message: string } };

export interface IGetFileUseCase {
    execute(params: GetFileUseCaseParams): Promise<GetFileUseCaseResult>;
}

export const GetFileUseCase = createAbstraction<IGetFileUseCase>("GetFileUseCase");

export namespace GetFileUseCase {
    export type Interface = IGetFileUseCase;
}
