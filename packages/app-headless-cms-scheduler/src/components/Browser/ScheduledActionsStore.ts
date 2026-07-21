import { observable, runInAction } from "mobx";
import { ListScheduledActionsGateway } from "@webiny/app-scheduler/features/listScheduledActions/abstractions.js";
import type { SchedulerEntry } from "@webiny/app-scheduler/types.js";

type NamespaceStatus = "loading" | "loaded" | "error";

interface NamespaceState {
    status: NamespaceStatus;
    // targetId -> scheduled action
    actions: Map<string, SchedulerEntry>;
    // The mutation-signal version this data was fetched at (see schedulerMutationSignal).
    version: number;
}

const PAGE_SIZE = 100;

/**
 * Module-level store that caches scheduled actions per namespace (one namespace per CMS model).
 *
 * The entries-list "Live" column cell reads from this store so that rendering the whole list costs
 * a single `listScheduledActions` query per model instead of one `getTargetScheduledAction` query
 * per row. The map is observable, so cells re-render once the data resolves.
 *
 * `load()` takes a `version`: cells pass the current `schedulerMutationSignal` version, so a
 * schedule/cancel (which bumps the signal) triggers exactly one refetch shared by all rows.
 */
class ScheduledActionsStore {
    // Shallow map: each namespace value is replaced wholesale on status change, so entry-level
    // reactivity is enough and we avoid deeply wrapping SchedulerEntry (incl. Date) instances.
    private readonly namespaces = observable.map<string, NamespaceState>(undefined, {
        deep: false
    });
    // Keyed by `namespace@version` so a refetch at a newer version isn't deduped against the old one.
    private readonly inflight = new Map<string, Promise<void>>();

    getAction(namespace: string, targetId: string): SchedulerEntry | undefined {
        return this.namespaces.get(namespace)?.actions.get(targetId);
    }

    /**
     * Loads and caches all scheduled actions for a namespace at the given signal version. No-op if
     * already loaded at that (or a newer) version; a newer version forces a refetch. Concurrent
     * calls for the same namespace+version share a single in-flight request.
     */
    load(
        gateway: ListScheduledActionsGateway.Interface,
        namespace: string,
        version = 0
    ): Promise<void> {
        const state = this.namespaces.get(namespace);
        if (state && state.status === "loaded" && state.version >= version) {
            return Promise.resolve();
        }
        const key = `${namespace}@${version}`;
        const existing = this.inflight.get(key);
        if (existing) {
            return existing;
        }
        const promise = this.fetchAll(gateway, namespace, version).finally(() => {
            this.inflight.delete(key);
        });
        this.inflight.set(key, promise);
        return promise;
    }

    private async fetchAll(
        gateway: ListScheduledActionsGateway.Interface,
        namespace: string,
        version: number
    ): Promise<void> {
        // Keep any previously loaded actions visible while refetching to avoid a flicker to empty.
        const previous = this.namespaces.get(namespace)?.actions ?? new Map();
        runInAction(() => {
            this.namespaces.set(namespace, { status: "loading", actions: previous, version });
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
                this.namespaces.set(namespace, { status: "loaded", actions, version });
            });
        } catch (error) {
            console.error(error);
            runInAction(() => {
                this.namespaces.set(namespace, { status: "error", actions: previous, version });
            });
        }
    }
}

export const scheduledActionsStore = new ScheduledActionsStore();
