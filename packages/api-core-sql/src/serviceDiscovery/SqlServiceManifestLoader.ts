import type { Knex } from "knex";
import type { IServiceManifestLoader } from "@webiny/api-core/features/serviceDiscovery/index.js";
import type { TableManager } from "~/TableManager.js";

const TABLE_NAME = "webiny_service_manifests";

interface IServiceManifestRow {
    name: string;
    manifest: string;
}

export class SqlServiceManifestLoader implements IServiceManifestLoader {
    private readonly knex: Knex;
    private readonly tableManager: TableManager;
    private readonly ensureTable: () => Promise<void>;

    constructor(knex: Knex, tableManager: TableManager) {
        this.knex = knex;
        this.tableManager = tableManager;
        this.ensureTable = tableManager.define(TABLE_NAME, table => {
            table.text("name").primary().notNullable();
            table.text("manifest").notNullable();
        });
    }

    async load() {
        await this.ensureTable();

        const rows = await this.knex<IServiceManifestRow>(
            this.tableManager.resolve(TABLE_NAME)
        ).select("name", "manifest");

        if (!rows.length) {
            return undefined;
        }

        return rows.map(row => ({
            name: row.name,
            manifest: JSON.parse(row.manifest)
        }));
    }
}
