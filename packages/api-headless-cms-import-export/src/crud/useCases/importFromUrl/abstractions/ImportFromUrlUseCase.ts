import type { GenericRecord } from "@webiny/api/types";
import type { TaskDataStatus } from "@webiny/tasks";

export interface IImportFromUrlUseCaseExecuteParams {
    id: string;
    maxInsertErrors?: number;
}

export interface IImportFromUrlUseCaseExecuteResponse {
    id: string;
    done: string[];
    failed: string[];
    aborted: string[];
    invalid: string[];
    status: TaskDataStatus;
    error?: GenericRecord;
}

export interface IImportFromUrlUseCase {
    execute(
        params: IImportFromUrlUseCaseExecuteParams
    ): Promise<IImportFromUrlUseCaseExecuteResponse | null>;
}
