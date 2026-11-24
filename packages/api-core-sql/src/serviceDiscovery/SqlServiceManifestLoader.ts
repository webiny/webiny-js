import type { Knex } from "knex";
import type { IServiceManifestLoader } from "@webiny/api-core/features/serviceDiscovery/index.js";
import type { TableManager } from "~/TableManager.js";
import {
    defineServiceManifestsTable,
    SERVICE_MANIFESTS_TABLE,
    type IServiceManifestRow
} from "./serviceManifestsTable.js";

export class SqlServiceManifestLoader implements IServiceManifestLoader {
    private readonly knex: Knex;
    private readonly tableManager: TableManager;
    private readonly ensureTable: () => Promise<void>;

    constructor(knex: Knex, tableManager: TableManager) {
        this.knex = knex;
        this.tableManager = tableManager;
        this.ensureTable = defineServiceManifestsTable(tableManager);
    }

    async load() {
        await this.ensureTable();

        const rows = await this.knex<IServiceManifestRow>(
            this.tableManager.resolve(SERVICE_MANIFESTS_TABLE)
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
