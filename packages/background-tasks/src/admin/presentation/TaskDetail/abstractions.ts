import { createAbstraction } from "@webiny/feature/admin";
import type { Task, TaskLog } from "~/admin/shared/types.js";

export interface ILogsViewModel {
    rows: TaskLog[];
    pagination: {
        totalCount: number;
        loading: boolean;
        hasMore: boolean;
    };
}

export interface ITaskDetailViewModel {
    task: Task | null;
    loading: boolean;
    logs: ILogsViewModel;
}

export interface ITaskDetailPresenter {
    vm: ITaskDetailViewModel;
    init(taskId: string): void;
    loadMore(): void;
}

export const TaskDetailPresenter = createAbstraction<ITaskDetailPresenter>("TaskDetailPresenter");

export namespace TaskDetailPresenter {
    export type Interface = ITaskDetailPresenter;
    export type ViewModel = ITaskDetailViewModel;
}
