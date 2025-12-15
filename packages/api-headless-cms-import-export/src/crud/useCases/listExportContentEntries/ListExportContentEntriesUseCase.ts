import type {
    IListExportContentEntriesUseCase,
    IListExportContentEntriesUseCaseExecuteParams,
    IListExportContentEntriesUseCaseExecuteResult
} from "./abstractions/ListExportContentEntriesUseCase.js";
import type { ITasksContextObject } from "@webiny/tasks";
import { convertTaskToCmsExportRecord } from "~/crud/utils/convertTaskToExportRecord.js";
import { EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK } from "~/tasks/constants.js";
import type {
    IControllerInput,
    IControllerOutput
} from "~/tasks/domain/abstractions/ExportContentEntriesController.js";

export interface IListExportContentEntriesUseCaseParams {
    listTasks: ITasksContextObject["listTasks"];
}

export class ListExportContentEntriesUseCase implements IListExportContentEntriesUseCase {
    private readonly listTasks: ITasksContextObject["listTasks"];

    public constructor(params: IListExportContentEntriesUseCaseParams) {
        this.listTasks = params.listTasks;
    }

    public async execute(
        params?: IListExportContentEntriesUseCaseExecuteParams
    ): Promise<IListExportContentEntriesUseCaseExecuteResult> {
        const result = await this.listTasks<
            IControllerInput,
            IControllerOutput
        >({
            ...params,
            sort: ["createdOn_DESC"],
            where: {
                definitionId: EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK
            }
        });

        return {
            items: result.items.map(item => convertTaskToCmsExportRecord(item)),
            meta: result.meta
        };
    }
}
