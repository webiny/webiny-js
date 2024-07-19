import { NonEmptyArray } from "@webiny/api/types";
import { ICmsImportExportFile } from "~/types";

export interface IValidateImportFromUrlIntegrityUseCaseExecuteParams {
    files: NonEmptyArray<ICmsImportExportFile>;
}

export interface IValidateImportFromUrlIntegrityUseCaseExecuteResult {
    id: string;
}

export interface IValidateImportFromUrlIntegrityUseCase {
    execute(
        params: IValidateImportFromUrlIntegrityUseCaseExecuteParams
    ): Promise<IValidateImportFromUrlIntegrityUseCaseExecuteResult>;
}
