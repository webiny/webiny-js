import { Context } from "@webiny/handler/types";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { I18NLocale, I18NContext } from "@webiny/api-i18n/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

export interface ListWhere {
    /**
     * Fields.
     */
    id?: string;
    id_in?: string[];
    id_not?: string;
    id_not_in?: string[];
    /**
     * Who created the entry?
     */
    createdBy?: string;
    createdBy_not?: string;
    createdBy_in?: string[];
    createdBy_not_in?: string[];
    /**
     * By datetime field.
     */
    datetime_startsWith?: string;
}

export interface ListParams {
    where: ListWhere;
    limit?: number;
    after?: string;
}

/**
 * A interface describing the reference to a user that created some data in the database.
 *
 * @category General
 */
export interface CreatedBy {
    /**
     * ID if the user.
     */
    id: string;
    /**
     * Full name of the user.
     */
    displayName: string | null;
    /**
     * Type of the user (admin, user)
     */
    type: string;
}

export interface ListMeta {
    /**
     * A cursor for pagination.
     */
    cursor: string | null;
    /**
     * Is there more items to load?
     */
    hasMoreItems: boolean;
    /**
     * Total count of the items in the storage.
     */
    totalCount: number;
}

export enum ApwContentTypes {
    PAGE = "page",
    CMS_ENTRY = "cms_entry"
}

export interface BaseFields {
    id: string;
    createdOn: string;
    savedOn?: string;
    createdBy: CreatedBy;
    tenant: string;
    locale: string;
}

export interface ApwScheduleAction extends BaseFields {
    data: ApwScheduleActionData;
}

export enum ApwScheduleActionTypes {
    PUBLISH = "publish",
    UNPUBLISH = "unpublish"
}

export interface ApwScheduleActionData {
    action: ApwScheduleActionTypes;
    type: ApwContentTypes;
    datetime: string;
    entryId: string;
}

export enum InvocationTypes {
    SCHEDULED = "scheduled"
}

interface BaseApwCrud<TEntry, TCreateEntryParams, TUpdateEntryParams> {
    get(id: string): Promise<TEntry | null>;

    create(data: TCreateEntryParams): Promise<TEntry>;

    update(id: string, data: TUpdateEntryParams): Promise<TEntry>;

    delete(id: string): Promise<Boolean>;
}

export interface ApwScheduleActionCrud
    extends BaseApwCrud<ApwScheduleAction, ApwScheduleActionData, ApwScheduleActionData> {
    list(
        params: ListParams & { sort?: "datetime_ASC" | "datetime_DESC" }
    ): Promise<[ApwScheduleAction[], ListMeta]>;

    getCurrentTask(): Promise<ApwScheduleAction | null>;

    updateCurrentTask(item: ApwScheduleAction): Promise<ApwScheduleAction>;

    deleteCurrentTask(): Promise<Boolean>;
}

export interface ScheduleActionContext extends Context, I18NContext, TenancyContext {
    scheduleAction: ApwScheduleActionCrud;
}

export interface CreateScheduleActionParams {
    getLocale: () => I18NLocale;
    getIdentity: () => SecurityIdentity;
    getTenant: () => Tenant;
    getPermission: (name: string) => Promise<SecurityPermission | null>;
    storageOperations: ApwScheduleActionStorageOperations;
}

interface CreateApwScheduleActionParams {
    item: ApwScheduleAction;
    input: ApwScheduleActionData;
}

interface StorageOperationsGetParams {
    where: {
        id: string;
        tenant: string;
        locale: string;
    };
}

interface StorageOperationsDeleteParams {
    id: string;
    tenant: string;
    locale: string;
}

export interface ApwScheduleActionListParams extends ListParams {
    where: ListWhere & {
        tenant: string;
        locale: string;
    };
    sort?: "datetime_ASC" | "datetime_DESC";
}

export type StorageOperationsGetScheduleActionParams = StorageOperationsGetParams;

export type StorageOperationsDeleteScheduleActionParams = StorageOperationsDeleteParams;
export type StorageOperationsListScheduleActionsParams = ApwScheduleActionListParams;

export type StorageOperationsCreateScheduleActionParams = CreateApwScheduleActionParams;

export interface StorageOperationsUpdateScheduleActionParams {
    item: ApwScheduleAction;
    input: ApwScheduleActionData;
}

export type StorageOperationsListScheduleActionsResponse = [ApwScheduleAction[], ListMeta];

export interface StorageOperationsUpdateCurrentTaskParams {
    item: ApwScheduleAction;
}

export interface StorageOperationsGetCurrentTaskParams {
    where: Pick<StorageOperationsGetParams["where"], "tenant" | "locale">;
}

export type StorageOperationsDeleteCurrentTaskParams = Pick<
    StorageOperationsDeleteParams,
    "tenant" | "locale"
>;

export interface ApwScheduleActionStorageOperations {
    get(params: StorageOperationsGetScheduleActionParams): Promise<ApwScheduleAction | null>;

    list(
        params: StorageOperationsListScheduleActionsParams
    ): Promise<StorageOperationsListScheduleActionsResponse>;

    create(params: StorageOperationsCreateScheduleActionParams): Promise<ApwScheduleAction>;

    update(params: StorageOperationsUpdateScheduleActionParams): Promise<ApwScheduleAction>;

    delete(params: StorageOperationsDeleteScheduleActionParams): Promise<Boolean>;

    getCurrentTask(
        params: StorageOperationsGetCurrentTaskParams
    ): Promise<ApwScheduleAction | null>;

    updateCurrentTask(params: StorageOperationsUpdateCurrentTaskParams): Promise<ApwScheduleAction>;

    deleteCurrentTask(params: StorageOperationsDeleteCurrentTaskParams): Promise<Boolean>;
}

export interface CreateApwContextParams {
    storageOperations: ApwScheduleActionStorageOperations;
}
