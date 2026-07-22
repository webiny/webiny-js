import { makeAutoObservable, observable, runInAction } from "mobx";
import { ListScheduledActionsGateway } from "@webiny/app-scheduler/features/listScheduledActions/abstractions.js";
import { GetScheduledActionGateway } from "@webiny/app-scheduler/features/getScheduledAction/abstractions.js";
import type { SchedulerEntry } from "@webiny/app-scheduler/types.js";
import { createNamespace } from "~/utils/index.js";
import {
    ScheduledActionsPresenter as Abstraction,
    type IScheduledActionsPresenter
} from "./abstractions.js";

const PAGE_SIZE = 100;

/**
 * Holds the scheduled actions relevant to the current view (entries list or a single entry),
 * keyed by target (entry) id. Fetching is driven by the presenters that own the view — the list
 * presenter decorator reloads on row changes, the form alert loads the open entry — so this holds
 * no invalidation logic of its own beyond `reload()`.
 */
class ScheduledActionsPresenterImpl implements IScheduledActionsPresenter {
    private _actions = observable.map<string, SchedulerEntry>();
    private _lastLoad: (() => Promise<void>) | null = null;

    constructor(
        private listGateway: ListScheduledActionsGateway.Interface,
        private getGateway: GetScheduledActionGateway.Interface
    ) {
        makeAutoObservable<
            ScheduledActionsPresenterImpl,
            "listGateway" | "getGateway" | "_lastLoad"
        >(this, {
            listGateway: false,
            getGateway: false,
            _lastLoad: false
        });
    }

    getScheduledAction(targetId: string): SchedulerEntry | undefined {
        return this._actions.get(targetId);
    }

    loadForModel(modelId: string): Promise<void> {
        const namespace = createNamespace({ modelId });
        this._lastLoad = () => this.fetchModel(namespace);
        return this._lastLoad();
    }

    loadForEntry(modelId: string, entryId: string): Promise<void> {
        const namespace = createNamespace({ modelId });
        this._lastLoad = () => this.fetchEntry(namespace, entryId);
        return this._lastLoad();
    }

    reload(): Promise<void> {
        return this._lastLoad ? this._lastLoad() : Promise.resolve();
    }

    dispose(): void {
        runInAction(() => this._actions.clear());
        this._lastLoad = null;
    }

    private async fetchModel(namespace: string): Promise<void> {
        try {
            const actions = new Map<string, SchedulerEntry>();
            let after: string | undefined = undefined;

            do {
                const response = await this.listGateway.execute({
                    namespace,
                    limit: PAGE_SIZE,
                    after,
                    sort: ["scheduledFor_ASC"]
                });
                for (const item of response.items) {
                    actions.set(item.targetId, item);
                }
                after = response.meta.hasMoreItems
                    ? (response.meta.cursor ?? undefined)
                    : undefined;
            } while (after);

            runInAction(() => {
                this._actions.replace(actions);
            });
        } catch (error) {
            console.error(error);
        }
    }

    private async fetchEntry(namespace: string, entryId: string): Promise<void> {
        try {
            const action = await this.getGateway.execute({ namespace, id: entryId });
            runInAction(() => {
                if (action) {
                    this._actions.set(entryId, action);
                } else {
                    this._actions.delete(entryId);
                }
            });
        } catch (error) {
            console.error(error);
        }
    }
}

export const ScheduledActionsPresenter = Abstraction.createImplementation({
    implementation: ScheduledActionsPresenterImpl,
    dependencies: [ListScheduledActionsGateway, GetScheduledActionGateway]
});
