import { createAbstraction } from "@webiny/feature/admin";
import type { SchedulerEntry } from "@webiny/app-scheduler/types.js";

export interface IScheduledActionsPresenter {
    /** Loads all scheduled actions for a model (used by the entries list). */
    loadForModel(modelId: string): Promise<void>;
    /** Loads the scheduled action for a single entry (used by the entry form). */
    loadForEntry(modelId: string, entryId: string): Promise<void>;
    /** Re-runs the last load. Call after a schedule/cancel to reflect the change. */
    reload(): Promise<void>;
    /** Returns the scheduled action for a target (entry) id, if any. */
    getScheduledAction(targetId: string): SchedulerEntry | undefined;
    dispose(): void;
}

export const ScheduledActionsPresenter = createAbstraction<IScheduledActionsPresenter>(
    "ScheduledActionsPresenter"
);

export namespace ScheduledActionsPresenter {
    export type Interface = IScheduledActionsPresenter;
}
