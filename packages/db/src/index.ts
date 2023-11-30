/**
 * TODO Remove when moved all packages to standalone storage opts.
 */
interface KeyField {
    name: string;
}

export interface Key {
    primary?: boolean;
    unique?: boolean;
    name: string;
    fields: KeyField[];
}

export interface ArgsBatch {
    instance: Batch;
    operation: Operation;
}
export interface Args {
    __batch?: ArgsBatch;
    table?: string;
    meta?: boolean;
    limit?: number;
    sort?: Record<string, 1 | -1>;
    data?: Record<string, any>;
    query?: Record<string, any>;
    keys?: Key[];
}

export type Result<T = any> = [T, Record<string, any>];

export interface DbDriver {
    create: (args: Args) => Promise<Result<true>>;
    read: <T = Record<string, any>>(args: Args) => Promise<Result<T[]>>;
    update: (args: Args) => Promise<Result<true>>;
    delete: (args: Args) => Promise<Result<true>>;

    // Logging functions.
    createLog: (args: {
        operation: string;
        data: Args;
        table: string;
        id: string;
    }) => Promise<Result<true>>;
    readLogs: <T = Record<string, any>>(args: { table: string }) => Promise<Result<T[]>>;
}

export type OperationType = "create" | "read" | "update" | "delete";
export type Operation = [OperationType, Args];

export type ConstructorArgs = {
    driver: DbDriver;
    table?: string;
    logTable?: string;
};

// Generates a short and sortable ID, e.g. "1607677774994.tfz58m".
const shortId = () => {
    const time = new Date().getTime();
    const uniqueId = Math.random().toString(36).slice(-6);

    return `${time}.${uniqueId}`;
};

interface LogDataBatch {
    id: string;
    type: string;
}
interface LogData
    extends Pick<Args, "table" | "meta" | "limit" | "sort" | "data" | "query" | "keys"> {
    batch: LogDataBatch | null;
}

// Picks necessary data from received args, ready to be stored in the log table.
const getCreateLogData = (args: Args): LogData => {
    const { table, meta, limit, sort, data, query, keys } = args;

    return {
        table,
        meta,
        limit,
        sort,
        data,
        query,
        keys,
        batch: args.__batch
            ? {
                  id: args.__batch.instance.id,
                  type: args.__batch.instance.type
              }
            : null
    };
};

class Db {
    public driver: DbDriver;
    public table: string;
    public logTable?: string;

    constructor({ driver, table, logTable }: ConstructorArgs) {
        this.driver = driver;
        // @ts-expect-error
        this.table = table;
        this.logTable = logTable;
    }

    public async create(args: Args): Promise<Result<true>> {
        const createArgs = { ...args, table: args.table || this.table };
        await this.createLog("create", createArgs);
        return this.driver.create(createArgs);
    }

    public async read<T = Record<string, any>>(args: Args): Promise<Result<T[]>> {
        const readArgs = { ...args, table: args.table || this.table };
        await this.createLog("read", readArgs);
        return this.driver.read(readArgs);
    }

    public async update(args: Args): Promise<Result<true>> {
        const updateArgs = { ...args, table: args.table || this.table };
        await this.createLog("update", updateArgs);
        return this.driver.update(updateArgs);
    }

    public async delete(args: Args): Promise<Result<true>> {
        const deleteArgs = { ...args, table: args.table || this.table };
        await this.createLog("delete", deleteArgs);
        return this.driver.delete(deleteArgs);
    }

    // Logging functions.
    public async createLog(operation: string, args: Args): Promise<Result<true> | null> {
        if (!this.logTable) {
            return null;
        }

        const data = getCreateLogData(args);
        return this.driver.createLog({ operation, data, table: this.logTable, id: shortId() });
    }

    public async readLogs<T = Record<string, any>>(): Promise<Result<T[]> | null> {
        if (!this.logTable) {
            return null;
        }

        return this.driver.readLogs({
            table: this.logTable
        });
    }

    public batch<
        T0 = any,
        T1 = any,
        T2 = any,
        T3 = any,
        T4 = any,
        T5 = any,
        T6 = any,
        T7 = any,
        T8 = any,
        T9 = any
    >(): Batch {
        return new Batch<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9>(this);
    }
}

class Batch<
    T0 = any,
    T1 = any,
    T2 = any,
    T3 = any,
    T4 = any,
    T5 = any,
    T6 = any,
    T7 = any,
    T8 = any,
    T9 = any
> {
    db: Db;
    type: "batch" | "transaction";
    id: string;
    meta: Record<string, any>;
    operations: Operation[];

    constructor(db: Db) {
        this.db = db;
        this.type = "batch";
        this.id = shortId();

        this.meta = {};
        this.operations = [];
    }

    push(...operations: Operation[]) {
        for (let i = 0; i < operations.length; i++) {
            const item = operations[i];
            this.operations.push(item);
        }
        return this;
    }

    create(...args: Args[]) {
        for (let i = 0; i < args.length; i++) {
            this.push(["create", args[i]]);
        }
        return this;
    }

    read(...args: Args[]) {
        for (let i = 0; i < args.length; i++) {
            this.push(["read", args[i]]);
        }
        return this;
    }

    update(...args: Args[]) {
        for (let i = 0; i < args.length; i++) {
            this.push(["update", args[i]]);
        }
        return this;
    }

    delete(...args: Args[]) {
        for (let i = 0; i < args.length; i++) {
            this.push(["delete", args[i]]);
        }
        return this;
    }

    async execute(): Promise<[T0?, T1?, T2?, T3?, T4?, T5?, T6?, T7?, T8?, T9?]> {
        /**
         * TODO: figure out which exact type to use instead of any.
         */
        const promises: Promise<any>[] = [];
        for (let i = 0; i < this.operations.length; i++) {
            const [operation, args] = this.operations[i];
            promises.push(
                this.db[operation]({
                    ...args,
                    __batch: {
                        instance: this,
                        operation: this.operations[i]
                    }
                })
            );
        }

        const result = Promise.all(promises);

        return result as Promise<[T0?, T1?, T2?, T3?, T4?, T5?, T6?, T7?, T8?, T9?]>;
    }
}

export { Batch, Db };
