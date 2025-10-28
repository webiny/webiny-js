import type { Context as HandlerContext } from "@webiny/handler/types.js";
import type { Context as TasksContext, ITask } from "@webiny/tasks/types.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";

export interface ILoggerLogCallableOptions {
    tenant?: string;
    locale?: string;
}
export interface ILoggerLogCallable {
    (source: string, data: unknown, options?: ILoggerLogCallableOptions): void;
}

export enum LogType {
    DEBUG = "debug",
    NOTICE = "notice",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}

export interface ILoggerLog {
    id: string;
    createdOn: string;
    tenant: string;
    locale: string;
    source: string;
    type: string;
    data: unknown;
}

export interface ILoggerCrudListLogsParamsWhere {
    tenant?: string;
    source?: string;
    type?: LogType;
}

export type ILoggerCrudListSort = "ASC" | "DESC";

export interface ILoggerCrudListLogsParams {
    where?: ILoggerCrudListLogsParamsWhere;
    sort?: ILoggerCrudListSort[];
    limit?: number;
    after?: string;
}

export interface ILoggerCrudListLogsResponse {
    items: ILoggerLog[];
    meta: {
        cursor: string | null;
        totalCount: number;
        hasMoreItems: boolean;
    };
}

export interface ILoggerCrudGetLogsParamsWhere {
    id: string;
    tenant?: string;
}

export interface ILoggerCrudGetLogsParams {
    where: ILoggerCrudGetLogsParamsWhere;
}

export interface ILoggerCrudGetLogResponse {
    item: ILoggerLog;
}

export interface ILoggerCrudDeleteLogResponse {
    item: ILoggerLog;
}

export interface ILoggerCrudDeleteLogParamsWhere {
    tenant?: string;
    id: string;
}

export interface ILoggerCrudDeleteLogParams {
    where: ILoggerCrudDeleteLogParamsWhere;
}

export interface ILoggerCrudDeleteLogsParamsWhere {
    tenant?: string;
    items: string[];
}

export interface ILoggerCrudDeleteLogsParams {
    where: ILoggerCrudDeleteLogsParamsWhere;
}

export interface ILoggerWithSourceLogCallable {
    (data: unknown, options?: ILoggerLogCallableOptions): void;
}

export interface ILoggerWithSource {
    info: ILoggerWithSourceLogCallable;
    notice: ILoggerWithSourceLogCallable;
    debug: ILoggerWithSourceLogCallable;
    warn: ILoggerWithSourceLogCallable;
    error: ILoggerWithSourceLogCallable;
    flush(): Promise<ILoggerLog[]>;
}

export interface ILoggerCrudListLogsCallable {
    (params: ILoggerCrudListLogsParams): Promise<ILoggerCrudListLogsResponse>;
}

export interface ILoggerPruneLogsResponse {
    task: ITask;
}

export interface ILoggerCrud {
    withSource(source: string): ILoggerWithSource;
    listLogs: ILoggerCrudListLogsCallable;
    getLog(params: ILoggerCrudGetLogsParams): Promise<ILoggerCrudGetLogResponse>;
    deleteLog(params: ILoggerCrudDeleteLogParams): Promise<ILoggerCrudDeleteLogResponse>;
    deleteLogs(params: ILoggerCrudDeleteLogsParams): Promise<ILoggerLog[]>;
    pruneLogs(): Promise<ILoggerPruneLogsResponse>;
}

export interface ILoggerStorageOperationsInsertParams {
    items: ILoggerLog[];
}

export interface ILoggerStorageOperationsListLogsCallable {
    (params: ILoggerCrudListLogsParams): Promise<ILoggerCrudListLogsResponse>;
}

export interface ILoggerStorageOperations {
    insert(params: ILoggerStorageOperationsInsertParams): Promise<ILoggerLog[]>;
    listLogs: ILoggerStorageOperationsListLogsCallable;
    getLog(params: ILoggerCrudGetLogsParams): Promise<ILoggerLog | null>;
    deleteLog(params: ILoggerCrudDeleteLogParams): Promise<ILoggerLog | null>;
    deleteLogs(params: ILoggerCrudDeleteLogsParams): Promise<ILoggerLog[]>;
}

export interface ILogger {
    debug: ILoggerLogCallable;
    info: ILoggerLogCallable;
    warn: ILoggerLogCallable;
    notice: ILoggerLogCallable;
    error: ILoggerLogCallable;
    flush(): Promise<ILoggerLog[]>;
}

export interface Context extends ApiCoreContext, Pick<TasksContext, "tasks">, HandlerContext {
    logger: ILoggerCrud & {
        log: ILogger;
    };
}

export interface IPruneLogsStoredValue {
    identity: Pick<SecurityIdentity, "id" | "displayName" | "type">;
    taskId: string;
}
