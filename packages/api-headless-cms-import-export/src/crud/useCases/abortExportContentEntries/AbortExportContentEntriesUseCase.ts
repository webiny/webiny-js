import type { ICmsImportExportRecord } from "~/domain/index.js";
import type {
    IAbortExportContentEntriesUseCase,
    IAbortExportContentEntriesUseCaseExecuteParams
} from "./abstractions/AbortExportContentEntriesUseCase.js";
import { convertTaskToCmsExportRecord } from "~/crud/utils/convertTaskToExportRecord.js";
import type { ITasksContextObject } from "@webiny/tasks";
import type {
    IControllerInput,
    IControllerOutput
} from "~/tasks/domain/abstractions/ExportContentEntriesController.js";

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
            IControllerInput,
            IControllerOutput
        >({
            id: params.id
        });
        return convertTaskToCmsExportRecord(task);
    }
}
