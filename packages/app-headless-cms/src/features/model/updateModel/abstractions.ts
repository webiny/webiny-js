import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel } from "~/types.js";

export interface UpdateModelParams {
    modelId: string;
    data: {
        name?: string;
        group?: string;
        layout?: any;
        fields?: any[];
        tags?: string[];
        settings?: Record<string, any>;
        description?: string;
        titleFieldId?: string | null;
        descriptionFieldId?: string | null;
        imageFieldId?: string | null;
        icon?: string;
    };
}

export interface IUpdateModelGateway {
    execute(params: UpdateModelParams): Promise<CmsModel>;
}

export const UpdateModelGateway = createAbstraction<IUpdateModelGateway>("UpdateModelGateway");

export namespace UpdateModelGateway {
    export type Interface = IUpdateModelGateway;
}

export interface IUpdateModelRepository {
    execute(params: UpdateModelParams): Promise<CmsModel>;
}

export const UpdateModelRepository =
    createAbstraction<IUpdateModelRepository>("UpdateModelRepository");

export namespace UpdateModelRepository {
    export type Interface = IUpdateModelRepository;
}

export interface IUpdateModelUseCase {
    execute(params: UpdateModelParams): Promise<CmsModel>;
}

export const UpdateModelUseCase = createAbstraction<IUpdateModelUseCase>("UpdateModelUseCase");

export namespace UpdateModelUseCase {
    export type Interface = IUpdateModelUseCase;
    export type Params = UpdateModelParams;
}
