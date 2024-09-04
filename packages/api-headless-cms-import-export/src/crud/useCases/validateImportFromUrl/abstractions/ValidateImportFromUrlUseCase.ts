import { ICmsImportExportFile } from "~/types";
import { GenericRecord, NonEmptyArray } from "@webiny/api/types";
import { CmsModel } from "@webiny/api-headless-cms/types";

export interface IValidateImportFromUrlUseCaseExecuteParams {
    data: string | GenericRecord;
}

export interface IValidateImportFromUrlUseCaseExecuteResult {
    model: CmsModel;
    files: NonEmptyArray<ICmsImportExportFile>;
}

export interface IValidateImportFromUrlUseCase {
    execute(
        params: IValidateImportFromUrlUseCaseExecuteParams
    ): Promise<IValidateImportFromUrlUseCaseExecuteResult>;
}
