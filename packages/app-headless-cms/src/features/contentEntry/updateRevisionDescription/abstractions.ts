import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface IUpdateRevisionDescriptionParams {
    model: CmsModel;
    id: string;
    revisionDescription: string;
}

export interface IUpdateRevisionDescriptionGateway {
    execute(params: IUpdateRevisionDescriptionParams): Promise<CmsContentEntry>;
}

export const UpdateRevisionDescriptionGateway =
    createAbstraction<IUpdateRevisionDescriptionGateway>("UpdateRevisionDescriptionGateway");

export namespace UpdateRevisionDescriptionGateway {
    export type Interface = IUpdateRevisionDescriptionGateway;
}

export interface IUpdateRevisionDescriptionRepository {
    execute(params: IUpdateRevisionDescriptionParams): Promise<CmsContentEntry>;
}

export const UpdateRevisionDescriptionRepository =
    createAbstraction<IUpdateRevisionDescriptionRepository>("UpdateRevisionDescriptionRepository");

export namespace UpdateRevisionDescriptionRepository {
    export type Interface = IUpdateRevisionDescriptionRepository;
}

export interface IUpdateRevisionDescriptionUseCase {
    execute(params: IUpdateRevisionDescriptionParams): Promise<CmsContentEntry>;
}

export const UpdateRevisionDescriptionUseCase =
    createAbstraction<IUpdateRevisionDescriptionUseCase>("UpdateRevisionDescriptionUseCase");

export namespace UpdateRevisionDescriptionUseCase {
    export type Interface = IUpdateRevisionDescriptionUseCase;
}
