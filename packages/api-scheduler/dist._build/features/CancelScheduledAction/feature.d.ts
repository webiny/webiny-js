/**
 * CancelScheduledAction Feature
 *
 * Provides the ability to cancel a scheduled action.
 * Removes both the EventBridge schedule and the CMS entry.
 */
export declare const CancelScheduledActionFeature: {
    name: string;
    register(container: import("@webiny/di").Container): void;
};
