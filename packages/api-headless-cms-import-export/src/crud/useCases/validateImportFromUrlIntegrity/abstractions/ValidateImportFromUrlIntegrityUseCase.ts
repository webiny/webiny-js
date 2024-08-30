import { NonEmptyArray } from "@webiny/api/types";
import { ICmsImportExportFile } from "~/types";
import { TaskDataStatus } from "@webiny/tasks";
import { CmsModel } from "@webiny/api-headless-cms/types";

export interface IValidateImportFromUrlIntegrityUseCaseExecuteParams {
    files: NonEmptyArray<ICmsImportExportFile>;
    model: CmsModel;
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
