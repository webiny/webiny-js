import { createAbstraction } from "@webiny/feature/admin";

export interface DeleteModelResult {
    id: string;
    status: string;
    deleted: number;
    total: number;
}

export interface IDeleteModelGateway {
    execute(modelId: string, confirmation: string): Promise<DeleteModelResult>;
}

export const DeleteModelGateway = createAbstraction<IDeleteModelGateway>("DeleteModelGateway");

export namespace DeleteModelGateway {
    export type Interface = IDeleteModelGateway;
}

export interface IDeleteModelRepository {
    execute(modelId: string, confirmation: string): Promise<DeleteModelResult>;
}

export const DeleteModelRepository =
    createAbstraction<IDeleteModelRepository>("DeleteModelRepository");

export namespace DeleteModelRepository {
    export type Interface = IDeleteModelRepository;
}

export interface IDeleteModelUseCase {
    execute(modelId: string, confirmation: string): Promise<DeleteModelResult>;
}

export const DeleteModelUseCase = createAbstraction<IDeleteModelUseCase>("DeleteModelUseCase");

export namespace DeleteModelUseCase {
    export type Interface = IDeleteModelUseCase;
    export type Result = DeleteModelResult;
}
