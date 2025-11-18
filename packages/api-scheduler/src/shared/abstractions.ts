import type { CmsModel } from "@webiny/api-headless-cms/types/model.js";
import { createAbstraction } from "@webiny/feature/api";

/**
 * Identity type - represents who scheduled an action
 */
export interface Identity {
    id: string;
    type: string;
    displayName: string;
}

/**
 * Scheduled Action Record - The data stored for a scheduled action
 */
export interface IScheduledAction {
    id: string;
    namespace: string; // Resource scope: "Cms/Entry/Article", "Mailer/Email"
    actionType: string; // Operation: "Publish", "Unpublish", "Send", "Delete"
    targetId: string; // Resource identifier (entry ID, email ID, etc.)
    scheduledBy: Identity;
    scheduledOn: Date;
    payload?: any; // Action-specific data
    error?: string; // Error if execution failed
}

/**
 * Scheduler Input - When to schedule
 */
export interface ISchedulerInput {
    scheduleOn: Date; // Future date (required)
}

/**
 * ScheduledActionHandler - Similar to EventHandler pattern
 *
 * Each application (CMS, Mailer, etc.) implements handlers for their actions.
 * This is the ONLY action abstraction needed.
 */
export interface IScheduledActionHandler {
    /**
     * Determines if this handler can handle the given action
     *
     * @param namespace - Resource scope (e.g., "Cms/Entry/Article")
     * @param actionType - Operation type (e.g., "Publish")
     */
    canHandle(namespace: string, actionType: string): boolean;

    /**
     * Executes the scheduled action
     */
    handle(action: IScheduledAction): Promise<void>;
}

export const ScheduledActionHandler =
    createAbstraction<IScheduledActionHandler>("ScheduledActionHandler");

export namespace ScheduledActionHandler {
    export type Interface = IScheduledActionHandler;
}

/**
 * SchedulerService - Cloud-agnostic scheduler service
 *
 * Abstracts the underlying scheduling infrastructure (AWS EventBridge, Azure Logic Apps, etc.)
 */
export interface ISchedulerService {
    create(params: { id: string; scheduleOn: Date; payload?: any }): Promise<void>;
    update(params: { id: string; scheduleOn: Date; payload?: any }): Promise<void>;
    delete(id: string): Promise<void>;
    exists(id: string): Promise<boolean>;
}

export const SchedulerService = createAbstraction<ISchedulerService>("SchedulerService");

export namespace SchedulerService {
    export type Interface = ISchedulerService;
}

/**
 * ScheduledActionModel - A CMS model used by the scheduler for persistence.
 */
export const ScheduledActionModel = createAbstraction<CmsModel>("ScheduledActionModel");

export namespace ScheduledActionModel {
    export type Interface = CmsModel;
}
