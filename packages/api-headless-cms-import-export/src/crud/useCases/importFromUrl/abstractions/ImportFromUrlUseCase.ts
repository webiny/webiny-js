import { ICmsImportExportProcessedFile } from "~/types";
import { GenericRecord, NonEmptyArray } from "@webiny/api/types";
import { TaskDataStatus } from "@webiny/tasks";

export interface IImportFromUrlUseCaseExecuteParams {
    id: string;
}

export interface IImportFromUrlUseCaseExecuteResponse {
    id: string;
    files: NonEmptyArray<ICmsImportExportProcessedFile> | undefined;
    status: TaskDataStatus;
    error?: GenericRecord;
}

export interface IImportFromUrlUseCase {
    execute(
        params: IImportFromUrlUseCaseExecuteParams
    ): Promise<IImportFromUrlUseCaseExecuteResponse | null>;
}
