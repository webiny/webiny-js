import { makeAutoObservable, computed } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { Task } from "~/admin/shared/types.js";
import {
    TaskListPresenter as Abstraction,
    type ITaskListPresenter,
    type ITaskListViewModel
} from "./abstractions.js";
import { TaskListDataSource } from "./TaskListDataSource.js";
import { ListTasksUseCase } from "~/admin/features/listTasks/abstractions.js";
import { DeleteTaskUseCase } from "~/admin/features/deleteTask/abstractions.js";
import { AbortTaskUseCase } from "~/admin/features/abortTask/abstractions.js";
import { TaskPermissions } from "~/admin/features/permissions/abstractions.js";

class TaskListPresenterImpl implements ITaskListPresenter {
    private _selectedTask: Task | null = null;

    constructor(
        private readonly listPresenter: ListPresenter.Interface<Task>,
        private readonly listTasksUseCase: ListTasksUseCase.Interface,
        private readonly deleteTaskUseCase: DeleteTaskUseCase.Interface,
        private readonly abortTaskUseCase: AbortTaskUseCase.Interface,
        private readonly permissions: TaskPermissions.Interface
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): ITaskListViewModel {
        return {
            list: this.listPresenter.vm,
            permissions: {
                canRead: this.permissions.canRead("task"),
                canDelete: this.permissions.canDelete("task")
            }
        };
    }

    get selectedTask(): Task | null {
        return this._selectedTask;
    }

    search = {
        set: (query: string) => this.listPresenter.actions.search.set(query),
        clear: () => this.listPresenter.actions.search.clear()
    };

    sort = {
        set: (field: string, direction: "ASC" | "DESC") =>
            this.listPresenter.actions.sort.set(field, direction),
        toggle: (field: string) => this.listPresenter.actions.sort.toggle(field)
    };

    filter = {
        set: (key: string, value: unknown) => this.listPresenter.actions.filter.set(key, value),
        clear: (key: string) => this.listPresenter.actions.filter.clear(key),
        clearAll: () => this.listPresenter.actions.filter.clearAll()
    };

    selection = {
        toggle: (id: string) => this.listPresenter.actions.selection.toggle(id),
        selectRangeTo: (id: string) => this.listPresenter.actions.selection.selectRangeTo(id),
        selectAll: () => this.listPresenter.actions.selection.selectAll(),
        deselectAll: () => this.listPresenter.actions.selection.deselectAll(),
        selectRows: (ids: string[]) => this.listPresenter.actions.selection.selectRows(ids),
        isSelected: (id: string) => this.listPresenter.actions.selection.isSelected(id)
    };

    loadMore = () => this.listPresenter.actions.loadMore();
    refresh = () => this.listPresenter.actions.refresh();

    deleteTask = async (id: string) => {
        await this.deleteTaskUseCase.execute(id);
        this._selectedTask = null;
        await this.listPresenter.actions.refresh();
    };

    abortTask = async (id: string) => {
        await this.abortTaskUseCase.execute({ id });
        await this.listPresenter.actions.refresh();
    };

    selectTask = (task: Task | null) => {
        this._selectedTask = task;
    };

    init(): void {
        const dataSource = new TaskListDataSource(this.listTasksUseCase);
        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 20
        });
    }
}

export const TaskListPresenter = Abstraction.createImplementation({
    implementation: TaskListPresenterImpl,
    dependencies: [
        ListPresenter,
        ListTasksUseCase,
        DeleteTaskUseCase,
        AbortTaskUseCase,
        TaskPermissions
    ]
});
