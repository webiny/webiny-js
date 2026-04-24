import type {
    IControllerInput,
    IControllerOutput
} from "~/tasks/domain/abstractions/ExportContentEntriesController.js";
import { convertTaskToCmsExportRecord } from "~/crud/utils/convertTaskToExportRecord.js";
import type { ITasksContextObject } from "@webiny/tasks";
import type {
    IGetExportContentEntriesUseCase,
    IGetExportContentEntriesUseCaseExecuteParams,
    IGetExportContentEntriesUseCaseExecuteResponse
} from "./abstractions/GetExportContentEntriesUseCase.js";
import { EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK } from "~/tasks/constants.js";
import type { IUrlSigner } from "~/tasks/utils/urlSigner/index.js";
import { prependExportPath } from "~/tasks/utils/helpers/exportPath.js";

export interface IGetExportContentEntriesUseCaseParams {
    getTask: ITasksContextObject["getTask"];
    urlSigner: IUrlSigner;
}

export class GetExportContentEntriesUseCase implements IGetExportContentEntriesUseCase {
    private readonly getTask: ITasksContextObject["getTask"];
    private readonly urlSigner: IUrlSigner;

    public constructor(params: IGetExportContentEntriesUseCaseParams) {
        this.getTask = params.getTask;
        this.urlSigner = params.urlSigner;
    }

    public async execute(
        params: IGetExportContentEntriesUseCaseExecuteParams
    ): Promise<IGetExportContentEntriesUseCaseExecuteResponse | null> {
        const task = await this.getTask<IControllerInput, IControllerOutput>(params.id);

        if (task?.definitionId !== EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK) {
            return null;
        }

        const record = convertTaskToCmsExportRecord(task);

        if (!record.files) {
            return record;
        }

        const files = await Promise.all(
            record.files.map(async file => {
                const key = prependExportPath(file.key);
                const { url: get } = await this.urlSigner.get({
                    ...file,
                    key
                });
                const { url: head } = await this.urlSigner.head({
                    ...file,
                    key
                });
                return {
                    ...file,
                    get,
                    head
                };
            })
        );

        return {
            ...record,
            files
        };
    }
}
