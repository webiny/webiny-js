import type { CmsModel } from "@webiny/api-headless-cms/types/model.js";
import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { SCHEDULED_ACTION_PUBLISH, SCHEDULED_ACTION_UNPUBLISH } from "~/constants.js";

/**
 * Identity type - represents who scheduled an action
 */
export interface Identity {
    id: string;
    type: string;
    displayName: string;
}

export type ScheduledActionType =
    | typeof SCHEDULED_ACTION_PUBLISH
    | typeof SCHEDULED_ACTION_UNPUBLISH;
/**
 * Scheduled Action Record - The data stored for a scheduled action
 */

export interface IScheduledActionEntryValues<T> {
    namespace: string; // Resource scope: "Cms/Entry/Article", "Mailer/Email"
    actionType: ScheduledActionType;
    targetId: string; // Resource identifier (entry ID, email ID, etc.)
    scheduledBy: Identity;
    scheduledFor: string;
    title: string;
    payload: T; // Action-specific data
    error: string | undefined; // Error if execution failed
}

export interface IScheduledActionEntry<T extends GenericRecord = GenericRecord> extends CmsEntry<
    IScheduledActionEntryValues<T>
> {}

export interface IScheduledAction<T extends GenericRecord = GenericRecord> extends Omit<
    IScheduledActionEntryValues<T>,
    "scheduledFor"
> {
    id: string;
    tenant: string;
    scheduledFor: Date;
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

/** Handle execution of a scheduled action. */
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
    tenant: string;
    namespace: string;
    scheduleFor: Date;
}
export interface ISchedulerServiceUpdateParams {
    id: string;
    tenant: string;
    namespace: string;
    scheduleFor: Date;
}

export interface ISchedulerServiceDeleteParams {
    id: string;
    namespace: string;
    tenant: string;
}

export interface ISchedulerServiceExistsParams {
    id: string;
    namespace: string;
    tenant: string;
}

export interface ISchedulerService {
    create(params: ISchedulerServiceCreateParams): Promise<void>;
    update(params: ISchedulerServiceUpdateParams): Promise<void>;
    delete(params: ISchedulerServiceDeleteParams): Promise<void>;
    exists(params: ISchedulerServiceExistsParams): Promise<boolean>;
}

/** Core service for managing scheduled actions. */
export const SchedulerService = createAbstraction<ISchedulerService>("SchedulerService");

export namespace SchedulerService {
    export type Interface = ISchedulerService;
    export type CreateParams = ISchedulerServiceCreateParams;
    export type UpdateParams = ISchedulerServiceUpdateParams;
    export type DeleteParams = ISchedulerServiceDeleteParams;
    export type ExistsParams = ISchedulerServiceExistsParams;
}

/**
 * Provides the scheduler's CMS model for the current request's tenant.
 *
 * A provider rather than the model itself: fetching a model is asynchronous and tenant-dependent,
 * and DI resolution is synchronous — so an already-resolved `CmsModel` could only be supplied by a
 * per-request hook running before every consumer. Consumers `await get()` at the point of use.
 */
export interface IScheduledActionModelProvider {
    get(): Promise<CmsModel>;
}

export const ScheduledActionModelProvider = createAbstraction<IScheduledActionModelProvider>(
    "ScheduledActionModelProvider"
);

export namespace ScheduledActionModelProvider {
    export type Interface = IScheduledActionModelProvider;
}
