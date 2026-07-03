import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel } from "~/types.js";

export interface IGetModelParams {
    modelId: string;
}

// Gateway

export interface IGetModelGateway {
    execute(params: IGetModelParams): Promise<CmsModel>;
}

export const GetModelGateway = createAbstraction<IGetModelGateway>("GetModelGateway");

export namespace GetModelGateway {
    export type Interface = IGetModelGateway;
}

// Repository

export interface IGetModelRepository {
    execute(params: IGetModelParams): Promise<CmsModel>;
}

export const GetModelRepository = createAbstraction<IGetModelRepository>("GetModelRepository");

export namespace GetModelRepository {
    export type Interface = IGetModelRepository;
}

// UseCase

export interface IGetModelUseCase {
    execute(params: IGetModelParams): Promise<CmsModel>;
}

export const GetModelUseCase = createAbstraction<IGetModelUseCase>("GetModelUseCase");

export namespace GetModelUseCase {
    export type Interface = IGetModelUseCase;
}
