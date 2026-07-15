/**
 * ListScheduledActions Feature
 *
 * Provides the ability to list scheduled actions with optional filtering by namespace or actionType.
 * Critical for CMS CRUD views showing all scheduled actions for a content model.
 */
export declare const ListScheduledActionsFeature: {
    name: string;
    register(container: import("@webiny/di").Container): void;
};
