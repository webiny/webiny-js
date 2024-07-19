import { ICmsImportExportFile } from "~/types";
import { NonEmptyArray } from "@webiny/api/types";

export interface IValidateImportFromUrlUseCaseExecuteParams {
    data: string;
}

export interface IValidateImportFromUrlUseCaseExecuteResult {
    files: NonEmptyArray<ICmsImportExportFile>;
}

export interface IValidateImportFromUrlUseCase {
    execute(
        params: IValidateImportFromUrlUseCaseExecuteParams
    ): Promise<IValidateImportFromUrlUseCaseExecuteResult>;
}
