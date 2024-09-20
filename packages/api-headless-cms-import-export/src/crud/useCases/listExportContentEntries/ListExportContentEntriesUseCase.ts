import type {
    IListExportContentEntriesUseCase,
    IListExportContentEntriesUseCaseExecuteParams,
    IListExportContentEntriesUseCaseExecuteResult
} from "./abstractions/ListExportContentEntriesUseCase";
import type { ITasksContextObject } from "@webiny/tasks";
import { convertTaskToCmsExportRecord } from "~/crud/utils/convertTaskToExportRecord";
import { EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK } from "~/tasks/constants";
import type {
    IExportContentEntriesControllerInput,
    IExportContentEntriesControllerOutput
} from "~/tasks/domain/abstractions/ExportContentEntriesController";

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
            IExportContentEntriesControllerInput,
            IExportContentEntriesControllerOutput
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
