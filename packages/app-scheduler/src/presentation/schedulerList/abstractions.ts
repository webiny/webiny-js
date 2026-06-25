import { createAbstraction } from "@webiny/feature/admin";
import type { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { SchedulerEntry } from "~/types.js";

export interface ISchedulerListPresenter {
    readonly list: ListPresenter.Interface<SchedulerEntry>;
    init(params: { namespace: string }): void;
    cancelItem(id: string): Promise<void>;
}

export const SchedulerListPresenter =
    createAbstraction<ISchedulerListPresenter>("Scheduler/ListPresenter");

export namespace SchedulerListPresenter {
    export type Interface = ISchedulerListPresenter;
}
