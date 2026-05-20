import { createAbstraction } from "@webiny/feature/admin";
import type { Task, TaskLog } from "~/admin/shared/types.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListActions } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface ITaskDetailViewModel {
    task: Task | null;
    loading: boolean;
    logs: IListViewModel<TaskLog>;
}

export interface ITaskDetailPresenter extends IListActions {
    vm: ITaskDetailViewModel;
    init(taskId: string): void;
}

export const TaskDetailPresenter = createAbstraction<ITaskDetailPresenter>("TaskDetailPresenter");

export namespace TaskDetailPresenter {
    export type Interface = ITaskDetailPresenter;
    export type ViewModel = ITaskDetailViewModel;
}
