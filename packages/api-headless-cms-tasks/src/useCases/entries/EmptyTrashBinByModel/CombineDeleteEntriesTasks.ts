import { ITaskResponseResult, TaskDataStatus } from "@webiny/tasks";
import { TaskRepository } from "./TaskRepository";
import {
    EntriesTask,
    IEmptyTrashBinByModelInput,
    IEmptyTrashBinByModelOutput,
    IEmptyTrashBinByModelTaskParams
} from "~/types";

const LIST_SUB_TASKS_LIMIT = 500;

export class CombineDeleteEntriesTasks {
    private repository: TaskRepository;

    constructor(repository: TaskRepository) {
        this.repository = repository;
    }

    public async execute(params: IEmptyTrashBinByModelTaskParams): Promise<ITaskResponseResult> {
        const { response, input, isAborted, isCloseToTimeout, context, store } = params;

        try {
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue({
                    ...input
                });
            }

            const result = await context.tasks.listTasks<
                IEmptyTrashBinByModelInput,
                IEmptyTrashBinByModelOutput
            >({
                where: {
                    parentId: store.getTask().id,
                    definitionId: EntriesTask.DeleteTrashBinEntries,
                    taskStatus_in: [TaskDataStatus.SUCCESS]
                },
                limit: LIST_SUB_TASKS_LIMIT
            });

            for (const subTask of result.items) {
                this.repository.addDone(subTask?.output?.done || []);
                this.repository.addFailed(subTask?.output?.failed || []);
            }

            return response.done({
                done: this.repository.getDone(),
                failed: this.repository.getFailed()
            });
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing CombineDeleteEntriesTasks");
        }
    }
}
