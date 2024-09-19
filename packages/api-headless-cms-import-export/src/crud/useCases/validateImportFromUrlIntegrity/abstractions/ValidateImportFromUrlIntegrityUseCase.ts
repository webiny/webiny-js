import type { NonEmptyArray } from "@webiny/api/types";
import type { ICmsImportExportFile } from "~/types";
import type { TaskDataStatus } from "@webiny/tasks";
import type { CmsModel } from "@webiny/api-headless-cms/types";

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
