import { makeAutoObservable } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import { ListScheduledActionsGateway } from "~/features/listScheduledActions/abstractions.js";
import { CancelScheduledActionGateway } from "~/features/cancelScheduledAction/abstractions.js";
import {
    SchedulerListPresenter as Abstraction,
    type ISchedulerListPresenter
} from "./abstractions.js";
import { SchedulerListDataSource } from "./SchedulerListDataSource.js";
import type { SchedulerEntry } from "~/types.js";

class SchedulerListPresenterImpl implements ISchedulerListPresenter {
    private _namespace!: string;

    constructor(
        private readonly _listPresenter: ListPresenter.Interface<SchedulerEntry>,
        private readonly listGateway: ListScheduledActionsGateway.Interface,
        private readonly cancelGateway: CancelScheduledActionGateway.Interface
    ) {
        makeAutoObservable(this);
    }

    get list(): ListPresenter.Interface<SchedulerEntry> {
        return this._listPresenter;
    }

    init(params: { namespace: string }) {
        this._namespace = params.namespace;
        const dataSource = new SchedulerListDataSource(this.listGateway, params.namespace);
        this._listPresenter.init({
            dataSource,
            initialSort: { field: "scheduledFor", direction: "DESC" },
            limit: 50
        });
    }

    async cancelItem(id: string) {
        await this.cancelGateway.execute({ namespace: this._namespace, id });
        await this._listPresenter.actions.refresh();
    }
}

export const SchedulerListPresenter = Abstraction.createImplementation({
    implementation: SchedulerListPresenterImpl,
    dependencies: [ListPresenter, ListScheduledActionsGateway, CancelScheduledActionGateway]
});
