/**
 * Main Scheduler Feature
 *
 * Registers all scheduler use cases and the composite handler.
 * Individual handler implementations are registered by consumer packages
 * (e.g., api-headless-cms-scheduler registers CMS-specific handlers).
 */
export declare const SchedulerFeature: {
    name: string;
    register(container: import("@webiny/di").Container): void;
};
