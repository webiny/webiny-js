import { createAbstraction } from "@webiny/feature/admin";

// Use Case

export interface IDeleteFolderUseCase {
    execute: (id: string) => Promise<void>;
}

export const DeleteFolderUseCase = createAbstraction<IDeleteFolderUseCase>("DeleteFolderUseCase");

export namespace DeleteFolderUseCase {
    export type Interface = IDeleteFolderUseCase;
}

// Repository

export interface IDeleteFolderRepository {
    execute: (id: string) => Promise<void>;
}

export const DeleteFolderRepository =
    createAbstraction<IDeleteFolderRepository>("DeleteFolderRepository");

export namespace DeleteFolderRepository {
    export type Interface = IDeleteFolderRepository;
}

// Gateway
export interface IDeleteFolderGateway {
    execute: (id: string) => Promise<void>;
}

export const DeleteFolderGateway = createAbstraction<IDeleteFolderGateway>("DeleteFolderGateway");

export namespace DeleteFolderGateway {
    export type Interface = IDeleteFolderGateway;
}
