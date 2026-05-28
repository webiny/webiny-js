import { createAbstraction } from "@webiny/feature/admin";
import type { TaskDefinition } from "~/admin/shared/types.js";

export interface ITaskDefinitionsViewModel {
    definitions: TaskDefinition[];
    loading: boolean;
}

export interface ITaskDefinitionsPresenter {
    vm: ITaskDefinitionsViewModel;
    init(): void;
}

export const TaskDefinitionsPresenter = createAbstraction<ITaskDefinitionsPresenter>(
    "TaskDefinitionsPresenter"
);

export namespace TaskDefinitionsPresenter {
    export type Interface = ITaskDefinitionsPresenter;
    export type ViewModel = ITaskDefinitionsViewModel;
}
