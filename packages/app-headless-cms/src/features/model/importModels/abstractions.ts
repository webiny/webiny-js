import { createAbstraction } from "@webiny/feature/admin";
import type {
    ValidateImportStructureResponseData,
    ImportStructureResponseData,
    ImportStructureVariables
} from "~/presentation/importContentModels/graphql.js";

export interface IValidateImportGateway {
    execute(data: ImportStructureVariables["data"]): Promise<ValidateImportStructureResponseData>;
}

export const ValidateImportGateway =
    createAbstraction<IValidateImportGateway>("ValidateImportGateway");

export namespace ValidateImportGateway {
    export type Interface = IValidateImportGateway;
}

export interface IValidateImportUseCase {
    execute(data: ImportStructureVariables["data"]): Promise<ValidateImportStructureResponseData>;
}

export const ValidateImportUseCase =
    createAbstraction<IValidateImportUseCase>("ValidateImportUseCase");

export namespace ValidateImportUseCase {
    export type Interface = IValidateImportUseCase;
}

export interface IImportModelsGateway {
    execute(data: ImportStructureVariables["data"]): Promise<ImportStructureResponseData>;
}

export const ImportModelsGateway = createAbstraction<IImportModelsGateway>("ImportModelsGateway");

export namespace ImportModelsGateway {
    export type Interface = IImportModelsGateway;
}

export interface IImportModelsUseCase {
    execute(data: ImportStructureVariables["data"]): Promise<ImportStructureResponseData>;
}

export const ImportModelsUseCase = createAbstraction<IImportModelsUseCase>("ImportModelsUseCase");

export namespace ImportModelsUseCase {
    export type Interface = IImportModelsUseCase;
}
