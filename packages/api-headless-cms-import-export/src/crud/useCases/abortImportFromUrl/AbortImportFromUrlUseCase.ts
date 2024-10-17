import { ITasksContextObject } from "@webiny/tasks";
import { IImportFromUrlUseCaseExecuteResponse } from "../importFromUrl";
import {
    IAbortImportFromUrlUseCase,
    IAbortImportFromUrlUseCaseExecuteParams
} from "./abstractions/AbortImportFromUrlUseCase";
import { NotFoundError } from "@webiny/handler-graphql";
import { convertTaskToImportRecord } from "~/crud/utils/convertTaskToImportRecord";
import type {
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController";
import { IGetImportFromUrlUseCase } from "~/crud/useCases/getImportFromUrl";

export interface IAbortImportFromUrlUseCaseParams {
    getTaskUseCase: IGetImportFromUrlUseCase;
    abortTask: ITasksContextObject["abort"];
}

export class AbortImportFromUrlUseCase implements IAbortImportFromUrlUseCase {
    private readonly getTaskUseCase: IGetImportFromUrlUseCase;
    private readonly abortTask: ITasksContextObject["abort"];

    public constructor(params: IAbortImportFromUrlUseCaseParams) {
        this.getTaskUseCase = params.getTaskUseCase;
        this.abortTask = params.abortTask;
    }
    public async execute(
        params: IAbortImportFromUrlUseCaseExecuteParams
    ): Promise<IImportFromUrlUseCaseExecuteResponse> {
        const task = await this.getTaskUseCase.execute(params);
        if (!task) {
            throw new NotFoundError(`Task with id "${params.id}" not found.`);
        }

        try {
            const result = await this.abortTask<
                IImportFromUrlControllerInput,
                IImportFromUrlControllerOutput
            >(params);
            return convertTaskToImportRecord(result);
        } catch (ex) {
            console.log("Could not abort the task.");
            console.error(ex);
            throw ex;
        }
    }
}
