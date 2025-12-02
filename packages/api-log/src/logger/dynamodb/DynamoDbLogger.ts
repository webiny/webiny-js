import type { ILogger, ILoggerLog, ILoggerLogCallableOptions } from "~/types.js";
import { LogType } from "~/types.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { mdbid } from "@webiny/utils";

interface IDynamoDbLoggerAddParams<T = GenericRecord> {
    source: string;
    data: T;
    type: LogType;
    options?: ILoggerLogCallableOptions;
}

export interface IDynamoDbLoggerParamsOnFlushCallable {
    (items: ILoggerLog[]): Promise<ILoggerLog[]>;
}

export interface IDynamoDbLoggerOptions {
    waitForFlushMs?: number;
}

export interface IDynamoDbLoggerParams {
    readonly getTenant: () => string;
    readonly onFlush: IDynamoDbLoggerParamsOnFlushCallable;
    readonly options?: IDynamoDbLoggerOptions;
}

type IAwaiter = Promise<ILoggerLog[]>;
/**
 * Milliseconds to wait before flushing logs.
 */
const defaultWaitForFlushMs = 1000;

export class DynamoDbLogger implements ILogger {
    private readonly items = new Set<ILoggerLog>();
    private readonly getTenant: () => string;
    private readonly onFlush: IDynamoDbLoggerParamsOnFlushCallable;
    private readonly options?: IDynamoDbLoggerOptions;

    private awaiter: IAwaiter | null = null;
    private timeout: NodeJS.Timeout | null = null;

    public constructor(params: IDynamoDbLoggerParams) {
        this.getTenant = params.getTenant;
        this.onFlush = params.onFlush;
        this.options = params.options;
    }
    public debug<T = GenericRecord>(
        source: string,
        data: T,
        options?: ILoggerLogCallableOptions
    ): void {
        return this.add<T>({
            data,
            source,
            type: LogType.DEBUG,
            options
        });
    }

    public info<T = GenericRecord>(
        source: string,
        data: T,
        options?: ILoggerLogCallableOptions
    ): void {
        return this.add<T>({
            data,
            source,
            type: LogType.INFO,
            options
        });
    }

    public warn<T = GenericRecord>(
        source: string,
        data: T,
        options?: ILoggerLogCallableOptions
    ): void {
        return this.add<T>({
            data,
            source,
            type: LogType.WARN,
            options
        });
    }

    public notice<T = GenericRecord>(
        source: string,
        data: T,
        options?: ILoggerLogCallableOptions
    ): void {
        return this.add<T>({
            data,
            source,
            type: LogType.NOTICE,
            options
        });
    }

    public error<T = GenericRecord>(
        source: string,
        data: T,
        options?: ILoggerLogCallableOptions
    ): void {
        return this.add<T>({
            data,
            source,
            type: LogType.ERROR,
            options
        });
    }

    public async flush(): Promise<ILoggerLog[]> {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        if (this.awaiter) {
            return this.awaiter;
        } else if (this.items.size === 0) {
            return [];
        }
        const items = Array.from(this.items);
        this.items.clear();

        this.awaiter = new Promise(resolve => {
            this.onFlush(items).then(items => {
                resolve(items);
                this.awaiter = null;
            });
        });

        return this.awaiter;
    }

    private startFlush(): void {
        if (this.items.size === 0) {
            return;
        } else if (this.awaiter || this.timeout) {
            return;
        }
        const ms = this.options?.waitForFlushMs || defaultWaitForFlushMs;

        this.timeout = setTimeout(() => {
            this.flush();
        }, ms);
    }

    private add<T = GenericRecord>(params: IDynamoDbLoggerAddParams<T>): void {
        this.items.add({
            id: mdbid(),
            createdOn: new Date().toISOString(),
            tenant: params.options?.tenant || this.getTenant(),
            data: params.data,
            source: params.source,
            type: params.type
        });
        this.startFlush();
    }
}

export const createDynamoDbLogger = (params: IDynamoDbLoggerParams): ILogger => {
    return new DynamoDbLogger(params);
};
