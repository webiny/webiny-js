import { createAbstraction } from "@webiny/feature/admin";
import type { Task } from "~/admin/shared/types.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListActions } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface ITaskListViewModel {
    list: IListViewModel<Task>;
    permissions: {
        canRead: boolean;
        canDelete: boolean;
    };
}

export interface ITaskListPresenter extends IListActions {
    vm: ITaskListViewModel;
    selectedTask: Task | null;
    deleteTask(id: string): Promise<void>;
    abortTask(id: string): Promise<void>;
    selectTask(task: Task | null): void;
    init(): void;
}

export const TaskListPresenter = createAbstraction<ITaskListPresenter>("TaskListPresenter");

export namespace TaskListPresenter {
    export type Interface = ITaskListPresenter;
    export type ViewModel = ITaskListViewModel;
}
