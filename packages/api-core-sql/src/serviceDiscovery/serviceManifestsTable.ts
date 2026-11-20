import type { TableManager } from "~/TableManager.js";

/** Service manifests, one row per service (`core`, `api`, `admin`, …), read by service discovery. */
export const SERVICE_MANIFESTS_TABLE = "webiny_service_manifests";

export interface IServiceManifestRow {
    name: string;
    /** The manifest, as JSON. */
    manifest: string;
}

/**
 * Declares the manifests table on `tableManager` and returns the function that ensures it on first
 * use. The loader and the writer both declare it here, so they can't disagree on its shape.
 */
export const defineServiceManifestsTable = (tableManager: TableManager): (() => Promise<void>) => {
    return tableManager.define(SERVICE_MANIFESTS_TABLE, table => {
        table.text("name").primary().notNullable();
        table.text("manifest").notNullable();
    });
};
