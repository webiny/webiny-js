import type { Knex } from "knex";

interface ITableManager {
    reset(): void;
    ensure(tableName: string, creator: (table: Knex.CreateTableBuilder) => void): Promise<void>;
}

export class TableManager implements ITableManager {
    private readonly knex: Knex;
    private readonly verified = new Set<string>();

    constructor(knex: Knex) {
        this.knex = knex;

        const g = globalThis as Record<string, unknown>;
        const managers = (g.__sqlTableManagers ??= []) as ITableManager[];
        managers.push(this);
    }

    public reset(): void {
        this.verified.clear();
    }

    public async ensure(
        tableName: string,
        creator: (table: Knex.CreateTableBuilder) => void
    ): Promise<void> {
        if (this.verified.has(tableName)) {
            return;
        }

        const exists = await this.knex.schema.hasTable(tableName);

        if (!exists) {
            await this.knex.schema.createTable(tableName, creator);
        }

        this.verified.add(tableName);
    }
}
