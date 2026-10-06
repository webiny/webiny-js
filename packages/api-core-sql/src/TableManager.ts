import type { Knex } from "knex";

interface ITableManager {
    reset(): void;
    resolve(tableName: string): string;
    ensure(tableName: string, creator: (table: Knex.CreateTableBuilder) => void): Promise<void>;
}

export class TableManager implements ITableManager {
    private readonly knex: Knex;
    private readonly prefix: string;
    private readonly verified = new Set<string>();
    private readonly pending = new Map<string, Promise<void>>();

    constructor(knex: Knex, prefix: string = "") {
        this.knex = knex;
        this.prefix = prefix ? `${prefix}_` : "";

        const g = globalThis as Record<string, unknown>;
        const managers = (g.__sqlTableManagers ??= []) as ITableManager[];
        managers.push(this);
    }

    public reset(): void {
        this.verified.clear();
        this.pending.clear();
    }

    public resolve(tableName: string): string {
        return `${this.prefix}${tableName}`;
    }

    public async ensure(
        tableName: string,
        creator: (table: Knex.CreateTableBuilder) => void
    ): Promise<void> {
        const resolved = this.resolve(tableName);

        if (this.verified.has(resolved)) {
            return;
        }

        // One TableManager serves every request, so concurrent first requests share a single
        // hasTable+createTable instead of racing into "table already exists". Cleared on failure so
        // a later call can retry.
        let pending = this.pending.get(resolved);
        if (!pending) {
            pending = this.ensureTable(resolved, creator).finally(() => {
                this.pending.delete(resolved);
            });
            this.pending.set(resolved, pending);
        }

        return pending;
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
