import { createAbstraction } from "@webiny/feature/admin";
import type { Task } from "~/admin/shared/types.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListActions } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface ITaskExecutionsViewModel {
    list: IListViewModel<Task>;
    permissions: {
        canRead: boolean;
        canDelete: boolean;
    };
}

export interface ITaskExecutionsPresenter extends IListActions {
    vm: ITaskExecutionsViewModel;
    selectedTask: Task | null;
    deleteTask(id: string): Promise<void>;
    abortTask(id: string): Promise<void>;
    selectTask(task: Task | null): void;
    init(): void;
}

export const TaskExecutionsPresenter =
    createAbstraction<ITaskExecutionsPresenter>("TaskExecutionsPresenter");

export namespace TaskExecutionsPresenter {
    export type Interface = ITaskExecutionsPresenter;
    export type ViewModel = ITaskExecutionsViewModel;
}
