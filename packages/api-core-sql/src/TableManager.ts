import type { Knex } from "knex";

type TableCreator = (table: Knex.CreateTableBuilder) => void;

export interface TableManagerOptions {
    /**
     * The schema was set up before the API took traffic (see `SqlSchemaConfig`): `ensure()` then
     * never checks for or creates a table. `setup()` still creates them.
     */
    schemaManaged?: boolean;
}

interface ITableManager {
    reset(): void;
    resolve(tableName: string): string;
    ensure(tableName: string, creator: (table: Knex.CreateTableBuilder) => void): Promise<void>;
}

export class TableManager implements ITableManager {
    private readonly knex: Knex;
    private readonly prefix: string;
    private readonly schemaManaged: boolean;
    private readonly verified = new Set<string>();
    private readonly pending = new Map<string, Promise<void>>();
    /* Tables declared by the storage operations using this manager, for deploy-time setup. */
    private readonly defined = new Map<string, TableCreator>();

    constructor(knex: Knex, prefix: string = "", options: TableManagerOptions = {}) {
        this.knex = knex;
        this.prefix = prefix ? `${prefix}_` : "";
        this.schemaManaged = options.schemaManaged === true;

        const g = globalThis as Record<string, unknown>;
        const managers = (g.__sqlTableManagers ??= []) as ITableManager[];
        managers.push(this);
    }

    /**
     * Creates the declared tables of every manager in this process that uses `knex`. Deploy-time
     * schema setup builds the storage operations (which declare their tables), then calls this.
     * Managers of other knex instances (an earlier setup in a warm process) are left alone.
     */
    public static async setupAll(knex: Knex): Promise<void> {
        const managers = ((globalThis as Record<string, unknown>).__sqlTableManagers ??
            []) as ITableManager[];
        for (const manager of managers) {
            if (manager instanceof TableManager && manager.knex === knex) {
                await manager.setup();
            }
        }
    }

    public reset(): void {
        this.verified.clear();
        this.pending.clear();
    }

    /**
     * Declares a table and returns the function that ensures it on first use. Declared tables are
     * created together by `setup()` (deploy-time schema setup).
     */
    public define(tableName: string, creator: TableCreator): () => Promise<void> {
        this.defined.set(tableName, creator);
        return () => this.ensure(tableName, creator);
    }

    /* Creates every declared table that doesn't exist yet. Runs at deploy time. */
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
        const resolved = this.resolve(tableName);

        if (this.schemaManaged || this.verified.has(resolved)) {
            return;
        }

        // One TableManager serves every request, so concurrent first requests share a single
        // hasTable+createTable instead of racing into "table already exists". Cleared on failure so
        // a later call can retry.
        const pending = this.pending.get(resolved);
        if (pending) {
            return pending;
        }

        const check = this.ensureTable(resolved, creator).finally(() => {
            // Only remove our own entry: after reset() a newer check may own this table's slot.
            if (this.pending.get(resolved) === check) {
                this.pending.delete(resolved);
            }
        });
        this.pending.set(resolved, check);

        return check;
    }

    private async ensureTable(
        resolved: string,
        creator: (table: Knex.CreateTableBuilder) => void
    ): Promise<void> {
        const exists = await this.knex.schema.hasTable(resolved);

        if (!exists) {
            await this.createTable(resolved, creator);
        }

        this.verified.add(resolved);
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
