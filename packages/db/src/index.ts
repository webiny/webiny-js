export type Key = { primary?: boolean; unique?: boolean; name: string; fields: { name: string }[] };

export type Args = {
    __batch?: { instance: Batch; operation: Operation };
    table?: string;
    meta?: boolean;
    limit?: number;
    sort?: Record<string, 1 | -1>;
    data?: Record<string, any>;
    query?: Record<string, any>;
    keys?: Key[];
};

export type Result<T = any> = [T, Record<string, any>];

export interface DbDriver {
    create: (args: Args) => Promise<Result<true>>;
    read: <T = Record<string, any>>(args: Args) => Promise<Result<T[]>>;
    update: (args: Args) => Promise<Result<true>>;
    delete: (args: Args) => Promise<Result<true>>;
}

export type OperationType = "create" | "read" | "update" | "delete";
export type Operation = [OperationType, Args];

class Db {
    driver: DbDriver;
    table: string;
    constructor({ driver, table }) {
        this.driver = driver;
        this.table = table;
    }

    async create(args: Args): Promise<Result<true>> {
        return this.driver.create({ ...args, table: args.table || this.table });
    }

    async read<T = Record<string, any>>(args: Args): Promise<Result<T[]>> {
        return this.driver.read({ ...args, table: args.table || this.table });
    }

    async update(args: Args): Promise<Result<true>> {
        return this.driver.update({ ...args, table: args.table || this.table });
    }
    async delete(args: Args): Promise<Result<true>> {
        return this.driver.delete({ ...args, table: args.table || this.table });
    }

    batch() {
        return new Batch(this);
    }
}

class Batch {
    db: Db;
    type: "batch" | "transaction";
    id: string;
    meta: Record<string, any>;
    operations: Operation[];
    constructor(db) {
        this.db = db;
        this.type = "batch";
        this.id = Math.random()
            .toString(36)
            .slice(-6); // e.g. tfz58m

        this.meta = {};
        this.operations = [];
    }

    push(...operations: Operation[]) {
        for (let i = 0; i < operations.length; i++) {
            const item = operations[i];
            this.operations.push(item);
        }
    }

    create(...args: Args[]) {
        for (let i = 0; i < args.length; i++) {
            this.push(["create", args[i]]);
        }
    }

    read(...args: Args[]) {
        for (let i = 0; i < args.length; i++) {
            this.push(["read", args[i]]);
        }
    }

    update(...args: Args[]) {
        for (let i = 0; i < args.length; i++) {
            this.push(["update", args[i]]);
        }
    }

    delete(...args: Args[]) {
        for (let i = 0; i < args.length; i++) {
            this.push(["delete", args[i]]);
        }
    }

    async execute() {
        const promises = [];
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

        return Promise.all(promises);
    }
}

export { Batch, Db };
