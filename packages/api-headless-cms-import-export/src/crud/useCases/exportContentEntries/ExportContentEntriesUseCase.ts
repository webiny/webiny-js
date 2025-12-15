import type { ICmsImportExportRecord } from "~/domain/index.js";
import type {
    IExportContentEntriesUseCase,
    IExportContentEntriesUseCaseExecuteParams
} from "./abstractions/ExportContentEntriesUseCase.js";
import type {
    IControllerInput,
    IControllerOutput
} from "~/tasks/domain/abstractions/ExportContentEntriesController.js";
import { EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK } from "~/tasks/constants.js";
import { convertTaskToCmsExportRecord } from "~/crud/utils/convertTaskToExportRecord.js";
import type { ITasksContextObject } from "@webiny/tasks";

export interface IExportContentEntriesUseCaseParams {
    triggerTask: ITasksContextObject["trigger"];
}

export class ExportContentEntriesUseCase implements IExportContentEntriesUseCase {
    private readonly triggerTask: ITasksContextObject["trigger"];

    public constructor(params: IExportContentEntriesUseCaseParams) {
        this.triggerTask = params.triggerTask;
    }

    public async execute(
        params: IExportContentEntriesUseCaseExecuteParams
    ): Promise<ICmsImportExportRecord> {
        const task = await this.triggerTask<
            IControllerInput,
            IControllerOutput
        >({
            name: `Export Content Entries and Assets Controller for "${params.modelId}"`,
            input: {
                modelId: params.modelId,
                exportAssets: params.exportAssets,
                limit: params.limit,
                where: params.where,
                sort: params.sort
            },
            definition: EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK
        });

        return convertTaskToCmsExportRecord(task);
    }
}
