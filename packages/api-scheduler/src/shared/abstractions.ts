import type { CmsModel } from "@webiny/api-headless-cms/types/model.js";
import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";

/**
 * Identity type - represents who scheduled an action
 */
export interface Identity {
    id: string;
    type: string;
    displayName: string;
}

export type ScheduledActionType = "publish" | "unpublish";
/**
 * Scheduled Action Record - The data stored for a scheduled action
 */
export interface IScheduledAction<T extends GenericRecord> {
    id: string;
    namespace: string; // Resource scope: "Cms/Entry/Article", "Mailer/Email"
    actionType: ScheduledActionType;
    targetId: string; // Resource identifier (entry ID, email ID, etc.)
    scheduledBy: Identity;
    scheduledFor: string;
    title?: string;
    payload: T; // Action-specific data
    error?: string; // Error if execution failed
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
    canHandle(namespace: string, actionType: ScheduledActionType): boolean;

    /**
     * Executes the scheduled action
     */
    handle(action: IScheduledAction<any>): Promise<void>;
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

export interface ISchedulerServiceCreateParams {
    id: string;
    namespace: string;
    scheduleFor: Date;
}
export interface ISchedulerServiceUpdateParams {
    id: string;
    namespace: string;
    scheduleFor: Date;
}

export interface ISchedulerService {
    create(params: ISchedulerServiceCreateParams): Promise<void>;
    update(params: ISchedulerServiceUpdateParams): Promise<void>;
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
