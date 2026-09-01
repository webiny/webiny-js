import { createAbstraction } from "@webiny/feature/admin";

export interface IExportModelsGateway {
    execute(models?: string[]): Promise<any>;
}

export const ExportModelsGateway = createAbstraction<IExportModelsGateway>("ExportModelsGateway");

export namespace ExportModelsGateway {
    export type Interface = IExportModelsGateway;
}

export interface IExportModelsUseCase {
    execute(models?: string[]): Promise<any>;
}

export const ExportModelsUseCase = createAbstraction<IExportModelsUseCase>("ExportModelsUseCase");

export namespace ExportModelsUseCase {
    export type Interface = IExportModelsUseCase;
}
