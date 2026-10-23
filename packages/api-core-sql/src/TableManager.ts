import type { Knex } from "knex";

interface ITableManager {
    reset(): void;
    resolve(tableName: string): string;
    ensure(
        tableName: string,
        creator: (table: Knex.CreateTableBuilder) => void,
        upgrade?: TableUpgrade
    ): Promise<void>;
}

/**
 * Brings a table that already existed up to date (`creator` only runs for new tables).
 * Must be idempotent: it runs once per process for every existing table.
 */
export interface TableUpgrade {
    (knex: Knex, resolvedTableName: string): Promise<void>;
}

export class TableManager implements ITableManager {
    private readonly knex: Knex;
    private readonly prefix: string;
    private readonly verified = new Set<string>();

    constructor(knex: Knex, prefix: string = "") {
        this.knex = knex;
        this.prefix = prefix ? `${prefix}_` : "";

        const g = globalThis as Record<string, unknown>;
        const managers = (g.__sqlTableManagers ??= []) as ITableManager[];
        managers.push(this);
    }

    public reset(): void {
        this.verified.clear();
    }

    public resolve(tableName: string): string {
        return `${this.prefix}${tableName}`;
    }

    public async ensure(
        tableName: string,
        creator: (table: Knex.CreateTableBuilder) => void,
        upgrade?: TableUpgrade
    ): Promise<void> {
        const resolved = this.resolve(tableName);

        if (this.verified.has(resolved)) {
            return;
        }

        const exists = await this.knex.schema.hasTable(resolved);

        if (!exists) {
            await this.knex.schema.createTable(resolved, creator);
        } else if (upgrade) {
            await upgrade(this.knex, resolved);
        }

        this.verified.add(resolved);
    }
}
