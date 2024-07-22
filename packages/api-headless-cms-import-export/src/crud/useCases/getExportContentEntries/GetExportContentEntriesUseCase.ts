import {
    IExportContentEntriesControllerInput,
    IExportContentEntriesControllerOutput
} from "~/tasks/domain/abstractions/ExportContentEntriesController";
import { convertTaskToCmsExportRecord } from "~/crud/utils/convertTaskToExportRecord";
import { ITasksContextObject } from "@webiny/tasks";
import {
    IGetExportContentEntriesUseCase,
    IGetExportContentEntriesUseCaseExecuteParams,
    IGetExportContentEntriesUseCaseExecuteResponse
} from "./abstractions/GetExportContentEntriesUseCase";
import { EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK } from "~/tasks/constants";

export interface IGetExportContentEntriesUseCaseParams {
    getTask: ITasksContextObject["getTask"];
}

export class GetExportContentEntriesUseCase implements IGetExportContentEntriesUseCase {
    private readonly getTask: ITasksContextObject["getTask"];

    public constructor(params: IGetExportContentEntriesUseCaseParams) {
        this.getTask = params.getTask;
    }

    public async execute(
        params: IGetExportContentEntriesUseCaseExecuteParams
    ): Promise<IGetExportContentEntriesUseCaseExecuteResponse | null> {
        const task = await this.getTask<
            IExportContentEntriesControllerInput,
            IExportContentEntriesControllerOutput
        >(params.id);

        if (task?.definitionId !== EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK) {
            return null;
        }

        return convertTaskToCmsExportRecord(task);
    }
}
