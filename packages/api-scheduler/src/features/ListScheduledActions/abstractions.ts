import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { IScheduledAction, ScheduledActionType } from "~/shared/abstractions.js";
import { ScheduledActionPersistenceError, NotAuthorizedError } from "~/domain/errors.js";
import type { CmsEntryListSort, CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

/**
 * ListScheduledActionsUseCase - List scheduled actions with optional filtering
 *
 * Used to retrieve all scheduled actions for a namespace (e.g., all actions for Article model)
 * or all actions of a specific type across namespaces.
 *
 * This is critical for CMS CRUD views where we need to show ALL scheduled actions
 * (publish, unpublish, delete) for a specific content model.
 */

export type DateISOString =
    `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;

export interface IListScheduledActionsWhere {
    namespace?: string;
    namespace_startsWith?: string;
    actionType?: ScheduledActionType;
    targetId?: string;
    targetId_startsWith?: string;
    scheduledBy?: string;
    scheduledFor?: DateISOString;
    scheduledFor_gte?: DateISOString;
    scheduledFor_lte?: DateISOString;
}

export type IListScheduledActionsMeta = CmsEntryMeta;

export interface IListScheduledActionsParams {
    where: IListScheduledActionsWhere;
    sort?: CmsEntryListSort;
    limit?: number;
    after?: string;
}

export interface IListScheduledActionsResponse<T extends GenericRecord> {
    items: IScheduledAction<T>[];
    meta: CmsEntryMeta;
}

export interface IListScheduledActionsErrors {
    persistence: ScheduledActionPersistenceError;
    unauthorized: NotAuthorizedError;
}

type ListScheduledActionsError = IListScheduledActionsErrors[keyof IListScheduledActionsErrors];

export interface IListScheduledActionsUseCase {
    execute<T extends GenericRecord>(
        params: IListScheduledActionsParams
    ): Promise<Result<IListScheduledActionsResponse<T>, ListScheduledActionsError>>;
}

/** List scheduled actions. */
export const ListScheduledActionsUseCase = createAbstraction<IListScheduledActionsUseCase>(
    "Scheduler/ListScheduledActionsUseCase"
);

export namespace ListScheduledActionsUseCase {
    export type Interface = IListScheduledActionsUseCase;
    export type Error = ListScheduledActionsError;
    export type Params = IListScheduledActionsParams;
    export type Where = IListScheduledActionsWhere;
    export type Sort = CmsEntryListSort;
    export type Meta = IListScheduledActionsMeta;
    export type Response<T extends GenericRecord> = IListScheduledActionsResponse<T>;
}
