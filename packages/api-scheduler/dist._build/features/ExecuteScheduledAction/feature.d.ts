/**
 * ExecuteScheduledAction Feature
 *
 * Provides the ability to execute a scheduled action when triggered by EventBridge.
 * Finds the appropriate handler and executes it, then cleans up the schedule entry.
 */
export declare const ExecuteScheduledActionFeature: {
    name: string;
    register(container: import("@webiny/di").Container): void;
};
