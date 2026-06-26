import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel } from "~/types.js";

export interface CloneModelParams {
    modelId: string;
    data: {
        name: string;
        singularApiName?: string;
        pluralApiName?: string;
        group?: string;
        icon?: string;
        description?: string;
    };
}

export interface ICloneModelGateway {
    execute(params: CloneModelParams): Promise<CmsModel>;
}

export const CloneModelGateway = createAbstraction<ICloneModelGateway>("CloneModelGateway");

export namespace CloneModelGateway {
    export type Interface = ICloneModelGateway;
}

export interface ICloneModelRepository {
    execute(params: CloneModelParams): Promise<CmsModel>;
}

export const CloneModelRepository =
    createAbstraction<ICloneModelRepository>("CloneModelRepository");

export namespace CloneModelRepository {
    export type Interface = ICloneModelRepository;
}

export interface ICloneModelUseCase {
    execute(params: CloneModelParams): Promise<CmsModel>;
}

export const CloneModelUseCase = createAbstraction<ICloneModelUseCase>("CloneModelUseCase");

export namespace CloneModelUseCase {
    export type Interface = ICloneModelUseCase;
    export type Params = CloneModelParams;
}
