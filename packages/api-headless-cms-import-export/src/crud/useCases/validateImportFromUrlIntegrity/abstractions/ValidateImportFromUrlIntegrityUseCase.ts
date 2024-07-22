import { NonEmptyArray } from "@webiny/api/types";
import { ICmsImportExportFile } from "~/types";
import { TaskDataStatus } from "@webiny/tasks";

export interface IValidateImportFromUrlIntegrityUseCaseExecuteParams {
    files: NonEmptyArray<ICmsImportExportFile>;
}

export interface IValidateImportFromUrlIntegrityUseCaseExecuteResult {
    id: string;
    status: TaskDataStatus;
}

export interface IValidateImportFromUrlIntegrityUseCase {
    execute(
        params: IValidateImportFromUrlIntegrityUseCaseExecuteParams
    ): Promise<IValidateImportFromUrlIntegrityUseCaseExecuteResult>;
}
