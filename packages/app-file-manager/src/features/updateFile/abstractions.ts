import { createAbstraction } from "@webiny/feature/admin";
import type { FmFile } from "../shared/types.js";

// Gateway — performs the API call via @webiny/sdk.
export interface UpdateFileGatewayParams {
    id: string;
    data: UpdateFileData;
    fields: string[];
}

export interface UpdateFileData {
    name?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    accessControl?: { type: "public" | "private-authenticated" };
    location?: { folderId: string };
    [key: string]: any;
}

export interface IUpdateFileGateway {
    execute(params: UpdateFileGatewayParams): Promise<FmFile>;
}

export const UpdateFileGateway = createAbstraction<IUpdateFileGateway>("UpdateFileGateway");

export namespace UpdateFileGateway {
    export type Interface = IUpdateFileGateway;
}

// Repository — delegates I/O to the gateway and updates the shared cache.
export interface IUpdateFileRepository {
    execute(params: UpdateFileGatewayParams): Promise<FmFile>;
}

export const UpdateFileRepository =
    createAbstraction<IUpdateFileRepository>("UpdateFileRepository");

export namespace UpdateFileRepository {
    export type Interface = IUpdateFileRepository;
}

// UseCase — orchestrates a single update-file operation.
export interface UpdateFileUseCaseParams {
    id: string;
    data: UpdateFileData;
}

export type UpdateFileUseCaseResult =
    | { success: true; file: FmFile }
    | { success: false; error: { code: string; message: string } };

export interface IUpdateFileUseCase {
    execute(params: UpdateFileUseCaseParams): Promise<UpdateFileUseCaseResult>;
}

export const UpdateFileUseCase = createAbstraction<IUpdateFileUseCase>("UpdateFileUseCase");

export namespace UpdateFileUseCase {
    export type Interface = IUpdateFileUseCase;
}
