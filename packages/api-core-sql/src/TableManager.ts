import type { Knex } from "knex";
import { getSchemaMemory, type ISchemaMemory } from "./schemaMemory/getSchemaMemory.js";
import { getConnectionKey } from "./schemaMemory/getConnectionKey.js";

type TableCreator = (table: Knex.CreateTableBuilder) => void;

export interface TableManagerOptions {
    /**
     * The schema was set up before the API took traffic (see `SqlSchemaConfig`): `ensure()` then
     * never checks for or creates a table. `setup()` still creates them. A function when it can
     * change (a server turns it on once its schema setup at start ran): read on every `ensure()`.
     */
    schemaManaged?: boolean | (() => boolean);
}

/*
 * Checks in flight, per memory and table, so concurrent first uses share one hasTable+createTable
 * instead of racing into "table already exists".
 */
const pendingChecks = new Map<string, Promise<void>>();

/**
 * The tables of one SQL storage part (core, audit logs, login) on one connection. Built wherever the
 * storage is built, which is once per request: it holds no state of its own. What it learns (which
 * tables exist) is kept for the process, in one memory per connection and table prefix, so a new
 * instance doesn't check a table again and a long-running server keeps one entry per connection, not
 * one per request.
 */
export class TableManager {
    private readonly knex: Knex;
    private readonly prefix: string;
    private readonly schemaManaged: () => boolean;
    /* Tables declared by the storage operations using this manager, for schema setup. */
    private readonly defined = new Map<string, TableCreator>();
    private memoryOfTables?: ISchemaMemory;

    constructor(knex: Knex, prefix: string = "", options: TableManagerOptions = {}) {
        this.knex = knex;
        this.prefix = prefix ? `${prefix}_` : "";
        const schemaManaged = options.schemaManaged;
        this.schemaManaged =
            typeof schemaManaged === "function" ? schemaManaged : () => schemaManaged === true;
    }

    /** Forgets which tables this connection has (test setups drop all tables between tests). */
    public reset(): void {
        this.memory.reset();
    }

    /**
     * Declares a table and returns the function that ensures it on first use. Declared tables are
     * created together by `setup()` (schema setup).
     */
    public define(tableName: string, creator: TableCreator): () => Promise<void> {
        this.defined.set(tableName, creator);
        return () => this.ensure(tableName, creator);
    }

    /* Creates every declared table that doesn't exist yet. Runs at schema setup. */
    public async setup(): Promise<void> {
        for (const [tableName, creator] of this.defined) {
            await this.ensureTable(this.resolve(tableName), creator);
        }
    }

    public resolve(tableName: string): string {
        return `${this.prefix}${tableName}`;
    }

    public async ensure(
        tableName: string,
        creator: (table: Knex.CreateTableBuilder) => void
    ): Promise<void> {
        if (this.schemaManaged()) {
            return;
        }

        const resolved = this.resolve(tableName);
        const memory = this.memory;
        if (memory.known.has(resolved)) {
            return;
        }

        // Cleared on failure so a later call can retry.
        const key = `${memory.key}:${resolved}`;
        const pending = pendingChecks.get(key);
        if (pending) {
            return pending;
        }

        const check = this.ensureTable(resolved, creator).finally(() => {
            // Only remove our own entry: after reset() a newer check may own this table's slot.
            if (pendingChecks.get(key) === check) {
                pendingChecks.delete(key);
            }
        });
        pendingChecks.set(key, check);

        return check;
    }

    /* Made on first use: a schema-managed manager never needs it. */
    private get memory(): ISchemaMemory {
        this.memoryOfTables ??= getSchemaMemory(
            `core.sql.tables:${getConnectionKey(this.knex)}:${this.prefix}`
        );
        return this.memoryOfTables;
    }

    private async ensureTable(
        resolved: string,
        creator: (table: Knex.CreateTableBuilder) => void
    ): Promise<void> {
        const exists = await this.knex.schema.hasTable(resolved);

        if (!exists) {
            await this.createTable(resolved, creator);
        }

        // A transaction can still roll back, and the table with it: only a committed table is known.
        if (!this.knex.isTransaction) {
            this.memory.known.add(resolved);
        }
    }

    private async createTable(
        resolved: string,
        creator: (table: Knex.CreateTableBuilder) => void
    ): Promise<void> {
        try {
            await this.knex.schema.createTable(resolved, creator);
        } catch (err) {
            // Another process (or connection) may have created it in the meantime. If it exists now,
            // that's success; otherwise the failure is real.
            const exists = await this.knex.schema.hasTable(resolved);
            if (exists) {
                return;
            }
            throw err;
        }
    }
}
