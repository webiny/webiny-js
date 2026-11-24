import type { Knex } from "knex";
import type { IServiceManifest } from "@webiny/api-core/features/serviceDiscovery/index.js";
import type { TableManager } from "~/TableManager.js";
import {
    defineServiceManifestsTable,
    SERVICE_MANIFESTS_TABLE,
    type IServiceManifestRow
} from "./serviceManifestsTable.js";

/**
 * Writes service manifests where `SqlServiceManifestLoader` reads them. A deployment calls it with
 * the manifests of the services it deployed: each one replaces the stored manifest of the same name,
 * and services it doesn't pass keep theirs (the admin deploy writes `admin` alone, after the api
 * deploy wrote `core`, `api` and `scheduler`).
 */
export class SqlServiceManifestWriter {
    private readonly knex: Knex;
    private readonly tableManager: TableManager;
    private readonly ensureTable: () => Promise<void>;

    constructor(knex: Knex, tableManager: TableManager) {
        this.knex = knex;
        this.tableManager = tableManager;
        this.ensureTable = defineServiceManifestsTable(tableManager);
    }

    async write(manifests: IServiceManifest[]): Promise<void> {
        // The input comes from a deployment's invocation payload, so it's checked before it's stored.
        const rows = new Map<string, IServiceManifestRow>();
        for (const item of manifests) {
            if (!item || typeof item.name !== "string" || !item.name) {
                throw new Error("A service manifest needs a `name`.");
            }
            if (!item.manifest || typeof item.manifest !== "object") {
                throw new Error(`The service manifest "${item.name}" needs a \`manifest\` object.`);
            }
            // One row per name: Postgres refuses an upsert that touches the same row twice.
            rows.set(item.name, { name: item.name, manifest: JSON.stringify(item.manifest) });
        }

        if (!rows.size) {
            return;
        }

        await this.ensureTable();

        await this.knex<IServiceManifestRow>(this.tableManager.resolve(SERVICE_MANIFESTS_TABLE))
            .insert([...rows.values()])
            .onConflict("name")
            .merge();
    }
}
