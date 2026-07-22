import { makeAutoObservable } from "mobx";

/**
 * A tiny observable bumped whenever a scheduled action is created, updated or cancelled via the
 * schedule dialog. The Live-column cells and the entry-form alert observe `version` and refetch
 * when it changes, so a schedule/cancel is reflected immediately without a page reload.
 *
 * Why this exists: a scheduled action is NOT part of the entry's data — it lives in a separate
 * dataset (`@webiny/app-scheduler`, loaded into `scheduledActionsStore`). So the normal entry
 * cache/re-render can't surface it, and a mutation in another package (the schedule dialog, or a
 * publish/unpublish the backend auto-cancels) has no way to invalidate our store. This signal is
 * that cross-package invalidation trigger; the cells themselves already re-render as MobX observers.
 *
 * Cleaner end-state (intentional follow-up, not done here): expose the scheduled action ON the CMS
 * entry — `extend type CmsEntrySystem { scheduledAction }` denormalized onto the entry, the way
 * `@webiny/api-headless-cms-workflows` stores `system.workflow`. Then the field rides the normal
 * entry cache and this signal, the separate store, and the client-side moot reconciliation all go
 * away. (A read-only resolver was considered but doesn't fit: a `CmsEntrySystem` field resolver
 * gets the `system` sub-object as its parent, which carries no entry id/modelId to key the lookup.)
 */
class SchedulerMutationSignal {
    version = 0;

    constructor() {
        makeAutoObservable(this);
    }

    bump() {
        this.version++;
    }
}

export const schedulerMutationSignal = new SchedulerMutationSignal();
