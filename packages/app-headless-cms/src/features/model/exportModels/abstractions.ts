import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel, CmsGroup } from "~/types.js";

export interface IExportModelsGateway {
    execute(models?: string[]): Promise<string>;
}

export interface IExportModelsUseCaseResponse {
    models: CmsModel[];
    groups: CmsGroup[];
}

export const ExportModelsGateway = createAbstraction<IExportModelsGateway>("ExportModelsGateway");

export namespace ExportModelsGateway {
    export type Interface = IExportModelsGateway;
}

export interface IExportModelsUseCase {
    execute(models?: string[]): Promise<IExportModelsUseCaseResponse | null>;
}

export const ExportModelsUseCase = createAbstraction<IExportModelsUseCase>("ExportModelsUseCase");

export namespace ExportModelsUseCase {
    export type Interface = IExportModelsUseCase;
    export type Response = IExportModelsUseCaseResponse;
}
