import { makeAutoObservable, runInAction, computed } from "mobx";
import type { Task, TaskLog } from "~/admin/shared/types.js";
import {
    TaskDetailPresenter as Abstraction,
    type ITaskDetailPresenter,
    type ITaskDetailViewModel
} from "./abstractions.js";
import { GetTaskUseCase } from "~/admin/features/getTask/abstractions.js";
import { ListLogsUseCase } from "~/admin/features/listLogs/abstractions.js";

class TaskDetailPresenterImpl implements ITaskDetailPresenter {
    private _task: Task | null = null;
    private _loading = false;
    private _logs: TaskLog[] = [];
    private _logsLoading = false;
    private _logsCursor: string | null = null;
    private _logsHasMore = false;
    private _logsTotalCount = 0;
    private _taskId: string | null = null;

    constructor(
        private readonly getTaskUseCase: GetTaskUseCase.Interface,
        private readonly listLogsUseCase: ListLogsUseCase.Interface
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): ITaskDetailViewModel {
        return {
            task: this._task,
            loading: this._loading,
            logs: {
                rows: this._logs,
                pagination: {
                    totalCount: this._logsTotalCount,
                    loading: this._logsLoading,
                    hasMore: this._logsHasMore
                }
            }
        };
    }

    async init(taskId: string): Promise<void> {
        this._taskId = taskId;
        this._loading = true;
        this._logs = [];
        this._logsCursor = null;
        this._logsHasMore = false;
        this._logsTotalCount = 0;

        const task = await this.getTaskUseCase.execute(taskId);

        runInAction(() => {
            this._task = task;
            this._loading = false;
        });

        await this.fetchLogs();
    }

    async loadMore(): Promise<void> {
        if (!this._logsHasMore || this._logsLoading) {
            return;
        }

        await this.fetchLogs(this._logsCursor);
    }

    private async fetchLogs(after?: string | null): Promise<void> {
        this._logsLoading = true;

        const result = await this.listLogsUseCase.execute({
            where: { task: this._taskId! },
            sort: ["createdOn_DESC"],
            limit: 50,
            after: after ?? undefined
        });

        runInAction(() => {
            if (after) {
                this._logs = [...this._logs, ...result.items];
            } else {
                this._logs = result.items;
            }
            this._logsCursor = result.meta.cursor;
            this._logsHasMore = result.meta.hasMoreItems;
            this._logsTotalCount = result.meta.totalCount;
            this._logsLoading = false;
        });
    }
}

export const TaskDetailPresenter = Abstraction.createImplementation({
    implementation: TaskDetailPresenterImpl,
    dependencies: [GetTaskUseCase, ListLogsUseCase]
});
