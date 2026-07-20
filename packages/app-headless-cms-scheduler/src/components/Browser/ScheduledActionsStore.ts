import { observable, runInAction } from "mobx";
import { ListScheduledActionsGateway } from "@webiny/app-scheduler/features/listScheduledActions/abstractions.js";
import type { SchedulerEntry } from "@webiny/app-scheduler/types.js";

type NamespaceStatus = "loading" | "loaded" | "error";

interface NamespaceState {
    status: NamespaceStatus;
    // targetId -> scheduled action
    actions: Map<string, SchedulerEntry>;
}

const PAGE_SIZE = 100;

/**
 * Module-level store that caches scheduled actions per namespace (one namespace per CMS model).
 *
 * The entries-list "Live" column cell reads from this store so that rendering the whole list costs
 * a single `listScheduledActions` query per model instead of one `getTargetScheduledAction` query
 * per row. The map is observable, so cells re-render once the data resolves.
 */
class ScheduledActionsStore {
    // Shallow map: each namespace value is replaced wholesale on status change, so entry-level
    // reactivity is enough and we avoid deeply wrapping SchedulerEntry (incl. Date) instances.
    private readonly namespaces = observable.map<string, NamespaceState>(undefined, {
        deep: false
    });
    private readonly inflight = new Map<string, Promise<void>>();

    getAction(namespace: string, targetId: string): SchedulerEntry | undefined {
        return this.namespaces.get(namespace)?.actions.get(targetId);
    }

    /**
     * Loads and caches all scheduled actions for a namespace. No-op if already loaded, and
     * concurrent calls for the same namespace share a single in-flight request.
     */
    load(gateway: ListScheduledActionsGateway.Interface, namespace: string): Promise<void> {
        if (this.namespaces.get(namespace)?.status === "loaded") {
            return Promise.resolve();
        }
        const existing = this.inflight.get(namespace);
        if (existing) {
            return existing;
        }
        const promise = this.fetchAll(gateway, namespace).finally(() => {
            this.inflight.delete(namespace);
        });
        this.inflight.set(namespace, promise);
        return promise;
    }

    /**
     * Drops the cache for a namespace and refetches. Call after a schedule/cancel mutation to
     * surface the change without a full page reload.
     */
    reload(gateway: ListScheduledActionsGateway.Interface, namespace: string): Promise<void> {
        this.inflight.delete(namespace);
        runInAction(() => {
            this.namespaces.delete(namespace);
        });
        return this.load(gateway, namespace);
    }

    private async fetchAll(
        gateway: ListScheduledActionsGateway.Interface,
        namespace: string
    ): Promise<void> {
        runInAction(() => {
            this.namespaces.set(namespace, { status: "loading", actions: new Map() });
        });

        try {
            const actions = new Map<string, SchedulerEntry>();
            let after: string | undefined = undefined;

            do {
                const response = await gateway.execute({
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
                this.namespaces.set(namespace, { status: "loaded", actions });
            });
        } catch (error) {
            console.error(error);
            runInAction(() => {
                this.namespaces.set(namespace, { status: "error", actions: new Map() });
            });
        }
    }
}

export const scheduledActionsStore = new ScheduledActionsStore();
