import { createAbstraction } from "@webiny/feature/admin";

// Gateway — performs the API call via @webiny/sdk.
export interface DeleteFileGatewayParams {
    id: string;
}

export interface IDeleteFileGateway {
    execute(params: DeleteFileGatewayParams): Promise<boolean>;
}

export const DeleteFileGateway = createAbstraction<IDeleteFileGateway>("DeleteFileGateway");

export namespace DeleteFileGateway {
    export type Interface = IDeleteFileGateway;
}

// Repository — delegates I/O to the gateway and removes the file from the shared cache.
export interface IDeleteFileRepository {
    execute(params: DeleteFileGatewayParams): Promise<boolean>;
}

export const DeleteFileRepository = createAbstraction<IDeleteFileRepository>(
    "DeleteFileRepository"
);

export namespace DeleteFileRepository {
    export type Interface = IDeleteFileRepository;
}

// UseCase — orchestrates a single delete-file operation.
export interface DeleteFileUseCaseParams {
    id: string;
}

export type DeleteFileUseCaseResult =
    | { success: true }
    | { success: false; error: { code: string; message: string } };

export interface IDeleteFileUseCase {
    execute(params: DeleteFileUseCaseParams): Promise<DeleteFileUseCaseResult>;
}

export const DeleteFileUseCase = createAbstraction<IDeleteFileUseCase>("DeleteFileUseCase");

export namespace DeleteFileUseCase {
    export type Interface = IDeleteFileUseCase;
}
