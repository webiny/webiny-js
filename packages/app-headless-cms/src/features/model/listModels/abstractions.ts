import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel } from "~/types.js";

// Gateway

export interface IListModelsGateway {
    execute(): Promise<CmsModel[]>;
}

export const ListModelsGateway = createAbstraction<IListModelsGateway>("ListModelsGateway");

export namespace ListModelsGateway {
    export type Interface = IListModelsGateway;
}

// Repository

export interface IListModelsRepository {
    execute(): Promise<CmsModel[]>;
}

export const ListModelsRepository =
    createAbstraction<IListModelsRepository>("ListModelsRepository");

export namespace ListModelsRepository {
    export type Interface = IListModelsRepository;
}

// UseCase

export interface IListModelsUseCase {
    execute(): Promise<CmsModel[]>;
}

export const ListModelsUseCase = createAbstraction<IListModelsUseCase>("ListModelsUseCase");

export namespace ListModelsUseCase {
    export type Interface = IListModelsUseCase;
}
