import { createAbstraction } from "@webiny/feature/admin";

// Use Case

export interface IDeleteModelGroupUseCase {
    execute: (id: string) => Promise<void>;
}

export const DeleteModelGroupUseCase =
    createAbstraction<IDeleteModelGroupUseCase>("DeleteModelGroupUseCase");

export namespace DeleteModelGroupUseCase {
    export type Interface = IDeleteModelGroupUseCase;
}

// Repository

export interface IDeleteModelGroupRepository {
    execute: (id: string) => Promise<void>;
}

export const DeleteModelGroupRepository = createAbstraction<IDeleteModelGroupRepository>(
    "DeleteModelGroupRepository"
);

export namespace DeleteModelGroupRepository {
    export type Interface = IDeleteModelGroupRepository;
}

// Gateway

export interface IDeleteModelGroupGateway {
    execute: (id: string) => Promise<void>;
}

export const DeleteModelGroupGateway =
    createAbstraction<IDeleteModelGroupGateway>("DeleteModelGroupGateway");

export namespace DeleteModelGroupGateway {
    export type Interface = IDeleteModelGroupGateway;
}
