import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel } from "~/types.js";

export interface CreateModelParams {
    name: string;
    singularApiName: string;
    pluralApiName?: string;
    group: string;
    icon?: string;
    description?: string;
    defaultFields?: boolean;
    tags?: string[];
}

export interface ICreateModelGateway {
    execute(data: CreateModelParams): Promise<CmsModel>;
}

export const CreateModelGateway = createAbstraction<ICreateModelGateway>("CreateModelGateway");

export namespace CreateModelGateway {
    export type Interface = ICreateModelGateway;
}

export interface ICreateModelRepository {
    execute(data: CreateModelParams): Promise<CmsModel>;
}

export const CreateModelRepository =
    createAbstraction<ICreateModelRepository>("CreateModelRepository");

export namespace CreateModelRepository {
    export type Interface = ICreateModelRepository;
}

export interface ICreateModelUseCase {
    execute(data: CreateModelParams): Promise<CmsModel>;
}

export const CreateModelUseCase = createAbstraction<ICreateModelUseCase>("CreateModelUseCase");

export namespace CreateModelUseCase {
    export type Interface = ICreateModelUseCase;
    export type Params = CreateModelParams;
}
