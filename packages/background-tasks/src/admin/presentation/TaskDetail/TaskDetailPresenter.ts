import { makeAutoObservable, runInAction, computed } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { Task, TaskLog } from "~/admin/shared/types.js";
import {
    TaskDetailPresenter as Abstraction,
    type ITaskDetailPresenter,
    type ITaskDetailViewModel
} from "./abstractions.js";
import { TaskDetailDataSource } from "./TaskDetailDataSource.js";
import { GetTaskUseCase } from "~/admin/features/getTask/abstractions.js";
import { ListLogsUseCase } from "~/admin/features/listLogs/abstractions.js";

class TaskDetailPresenterImpl implements ITaskDetailPresenter {
    private _task: Task | null = null;
    private _loading = false;

    constructor(
        private readonly listPresenter: ListPresenter.Interface<TaskLog>,
        private readonly getTaskUseCase: GetTaskUseCase.Interface,
        private readonly listLogsUseCase: ListLogsUseCase.Interface
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): ITaskDetailViewModel {
        return {
            task: this._task,
            loading: this._loading,
            logs: this.listPresenter.vm
        };
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

    async init(taskId: string): Promise<void> {
        this._loading = true;

        const task = await this.getTaskUseCase.execute(taskId);

        runInAction(() => {
            this._task = task;
            this._loading = false;
        });

        const dataSource = new TaskDetailDataSource(this.listLogsUseCase, taskId);
        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 50
        });
    }
}

export const TaskDetailPresenter = Abstraction.createImplementation({
    implementation: TaskDetailPresenterImpl,
    dependencies: [ListPresenter, GetTaskUseCase, ListLogsUseCase]
});
