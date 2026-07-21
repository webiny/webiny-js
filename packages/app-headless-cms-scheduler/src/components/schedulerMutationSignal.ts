import { makeAutoObservable } from "mobx";

/**
 * A tiny observable bumped whenever a scheduled action is created, updated or cancelled via the
 * schedule dialog. The Live-column cells and the entry-form alert observe `version` and refetch
 * when it changes, so a schedule/cancel is reflected immediately without a page reload.
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
