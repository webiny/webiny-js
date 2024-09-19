import type { ICmsImportExportRecord } from "~/domain";
import type {
    IAbortExportContentEntriesUseCase,
    IAbortExportContentEntriesUseCaseExecuteParams
} from "./abstractions/AbortExportContentEntriesUseCase";
import { convertTaskToCmsExportRecord } from "~/crud/utils/convertTaskToExportRecord";
import type { ITasksContextObject } from "@webiny/tasks";
import type {
    IExportContentEntriesControllerInput,
    IExportContentEntriesControllerOutput
} from "~/tasks/domain/abstractions/ExportContentEntriesController";

export interface IAbortExportContentEntriesUseCaseParams {
    abortTask: ITasksContextObject["abort"];
}

export class AbortExportContentEntriesUseCase implements IAbortExportContentEntriesUseCase {
    private readonly abortTask: ITasksContextObject["abort"];

    public constructor(params: IAbortExportContentEntriesUseCaseParams) {
        this.abortTask = params.abortTask;
    }

    public async execute(
        params: IAbortExportContentEntriesUseCaseExecuteParams
    ): Promise<ICmsImportExportRecord> {
        const task = await this.abortTask<
            IExportContentEntriesControllerInput,
            IExportContentEntriesControllerOutput
        >({
            id: params.id
        });
        return convertTaskToCmsExportRecord(task);
    }
}
