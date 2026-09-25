import type { CmsEntryListParams } from "@webiny/api-headless-cms/types/index.js";
import { TaskCache } from "./TaskCache.js";
import type { IBulkActionOperationByModelTaskParams } from "~/types.js";
import { BulkActionOperationByModelAction } from "~/types.js";
import { EntriesBulkAction } from "~/features/EntriesBulkAction/abstractions.js";
import type { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import type { TriggerTaskUseCase } from "@webiny/background-tasks/api";
import type { Logger } from "@webiny/api-core/features/logger/index.js";

const MAX_TASK_LIST_LENGTH = 10;

/**
 * The `CreateTasksByModel` class handles the execution of a task to process entries in batches.
 */
export class CreateTasksByModel {
    private readonly taskCache: TaskCache;
    private readonly batchSize: number;
    private readonly bulkAction: EntriesBulkAction.Interface;
    private readonly triggerTask: TriggerTaskUseCase.Interface;
    private readonly getModel: GetModelUseCase.Interface;
    private readonly logger: Logger.Interface;
    /** Every entry id dispatched during THIS run, used to detect a round that made no progress. */
    private readonly dispatched: string[] = [];

    constructor(
        getModel: GetModelUseCase.Interface,
        triggerTask: TriggerTaskUseCase.Interface,
        bulkAction: EntriesBulkAction.Interface,
        taskDefinition: string,
        batchSize: number,
        logger: Logger.Interface
    ) {
        this.getModel = getModel;
        this.taskCache = new TaskCache(taskDefinition);
        this.batchSize = batchSize;
        this.bulkAction = bulkAction;
        this.triggerTask = triggerTask;
        this.logger = logger;
    }

    async execute(params: IBulkActionOperationByModelTaskParams) {
        const { input, controller } = params;

        try {
            const modelResult = await this.getModel.execute(input.modelId);

            if (modelResult.isFail()) {
                return controller.response.error(`Model with ${input.modelId} not found!`);
            }

            const model = modelResult.value;

            const listEntriesParams: CmsEntryListParams = {
                where: input.where,
                search: input.search,
                after: input.after,
                limit: this.batchSize
            };

            while (true) {
                if (controller.runtime.isAborted()) {
                    return controller.response.aborted();
                } else if (controller.runtime.isCloseToTimeout()) {
                    return await this.dispatchSubtasks(params);
                }

                // List entries from the HCMS based on the provided query
                const { entries, meta } = await this.bulkAction.loadData(model, listEntriesParams);

                // End the task if no entries match the query
                if (meta.totalCount === 0) {
                    return controller.response.continue({
                        ...input,
                        action: BulkActionOperationByModelAction.END_TASK
                    });
                }

                // Continue processing if we are reached the task list length limit
                if (this.taskCache.getTasksLength() === MAX_TASK_LIST_LENGTH) {
                    return await this.dispatchSubtasks(params);
                }

                // Continue processing if no entries are returned in the current batch
                if (entries.length === 0) {
                    return await this.dispatchSubtasks(params);
                }

                // Extract entry IDs
                const ids: string[] = [];
                for (let i = 0; i < entries.length; i++) {
                    ids.push(entries[i].id);
                }

                if (ids.length > 0) {
                    this.dispatched.push(...ids);
                    this.taskCache.cacheTask({
                        actionName: input.actionName,
                        modelId: input.modelId,
                        identity: input.identity,
                        data: input.data,
                        ids
                    });
                }

                // Continue processing if there are no more entries or pagination is complete
                if (!meta.hasMoreItems || !meta.cursor) {
                    return await this.dispatchSubtasks(params);
                }

                listEntriesParams.after = meta.cursor;
            }
        } catch (ex) {
            return controller.response.error(ex.message ?? `Error while creating task.`);
        }
    }

    /**
     * Triggers the cached subtasks and hands control to PROCESS_SUBTASKS.
     *
     * Two ways this loop fails to terminate, both guarded here:
     *
     * 1. Nothing could be dispatched. The parent advances to PROCESS_SUBTASKS regardless, finds no
     *    running children, and comes straight back to CHECK_MORE_SUBTASKS with the same entries.
     * 2. A round completed without changing the result set. The engine re-lists from the start on
     *    every CHECK_MORE_SUBTASKS and relies on the action's `loadData` filter to exclude what it
     *    has already handled. When `processData` fails permanently — a locked (published) entry is
     *    the common case — the filter keeps matching and the same batch is dispatched forever, at
     *    one 120s wait per round until maxIterations (500) is reached hours later.
     *
     * Both end the task with a message naming the cause, instead of spinning.
     */
    private async dispatchSubtasks(params: IBulkActionOperationByModelTaskParams) {
        const { input, controller } = params;
        const signature = this.dispatchedSignature();

        if (signature && signature === input.dispatchedSignature) {
            return controller.response.error(
                `Bulk action "${input.actionName}" is not converging: the ${this.dispatched.length} ` +
                    `entrie(s) dispatched in the previous round are still returned by loadData. ` +
                    `Either its filter does not exclude processed entries, or processData fails for ` +
                    `them (a published entry is locked and cannot be updated).`
            );
        }

        const pending = this.taskCache.getTasksLength();
        const { triggered, failures } = await this.taskCache.triggerTask(
            this.triggerTask,
            controller.state.getTask()
        );

        for (const failure of failures) {
            this.logger.error(
                { error: failure, actionName: input.actionName, modelId: input.modelId },
                "Failed to trigger a bulk-action subtask."
            );
        }

        if (pending > 0 && triggered === 0) {
            return controller.response.error(
                `Bulk action "${input.actionName}" could not dispatch any of its ${pending} ` +
                    `subtask(s): ${failures[0]?.message ?? "unknown error"}`
            );
        }

        return controller.response.continue({
            ...input,
            action: BulkActionOperationByModelAction.PROCESS_SUBTASKS,
            dispatchedSignature: signature
        });
    }

    /**
     * A stable, compact fingerprint of everything dispatched so far. Compact because it travels in
     * the task input across iterations, so the raw id list would grow without bound.
     */
    private dispatchedSignature(): string | undefined {
        if (this.dispatched.length === 0) {
            return undefined;
        }

        const joined = [...this.dispatched].sort().join(",");
        let hash = 0;
        for (let i = 0; i < joined.length; i++) {
            hash = (Math.imul(31, hash) + joined.charCodeAt(i)) | 0;
        }

        return `${this.dispatched.length}:${(hash >>> 0).toString(36)}`;
    }
}
