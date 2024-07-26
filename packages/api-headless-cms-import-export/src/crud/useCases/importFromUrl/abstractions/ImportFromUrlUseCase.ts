import { GenericRecord } from "@webiny/api/types";
import { TaskDataStatus } from "@webiny/tasks";

export interface IImportFromUrlUseCaseExecuteParams {
    id: string;
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
