import type { Knex } from "knex";
import { createAbstraction } from "@webiny/feature/api";
import { WebinyError } from "@webiny/error";
import { KnexClient } from "@webiny/api-core-sql";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { PgSchema } from "@webiny/api-headless-cms-pg/features/schema/abstractions.js";
import { EntryValuesPatcher } from "@webiny/api-headless-cms-pg/features/entryValuesPatcher/abstractions.js";
import { rowToEntry } from "@webiny/api-headless-cms-pg/features/entries/entryRow.js";
import { Permissions, ROOT_FOLDER } from "@webiny/shared-aco";
import type { FolderLevelPermission, FolderPermission } from "@webiny/api-aco/flp/flp.types.js";
import { FolderCatalogSchema } from "./FolderCatalogSchema.js";

interface FolderRow {
    id: string;
    type: string;
    slug: string;
    parent_id: string | null;
    id_path: string[];
    slug_path: string;
}

interface GrantRow {
    folder_id: string;
    target: FolderPermission["target"];
    level: FolderPermission["level"];
}

/** A folder as its entry describes it. */
interface FolderSource {
    id: string;
    type: string;
    slug: string;
    parentId: string | null;
    permissions: FolderPermission[];
}

export interface ListFolderIdsParams {
    type: string;
    parentId?: string;
    /** Folders whose `slug_path` starts with this. */
    path_startsWith?: string;
}

export interface ListCandidateIdsParams {
    type: string;
    parentId?: string;
    /** Permission targets (`admin:<id>`, `team:<slug>`) whose grants can give access. */
    targets: string[];
    /** Slug paths given to the targets in code: a folder, and with `subtree` its descendants. */
    paths: Array<{ base: string; subtree: boolean }>;
}

export interface IFolderCatalog {
    /**
     * Brings the catalog in line with the given folder entries, inside the transaction that wrote
     * them. A changed slug or parent rewrites the paths of the whole subtree, including the
     * descendants' `path` values, in the same transaction.
     *
     * Returns the ids of the folder entries whose values it patched; their search rows need
     * rebuilding.
     */
    sync(trx: Knex.Transaction, folderModel: CmsModel, entryIds: string[]): Promise<string[]>;
    /**
     * The folders' permissions as the FLP catalog reports them: their own, then the ones inherited
     * from their ancestors. Folders not in the catalog are left out.
     */
    getEffective(folderModel: CmsModel, ids: string[]): Promise<Map<string, FolderLevelPermission>>;
    /** Ids of the folders of a type, optionally only the children of one folder. */
    listIds(folderModel: CmsModel, params: ListFolderIdsParams): Promise<string[]>;
    /**
     * Ids of the folders (of a type, optionally only one folder's children) a holder of the
     * targets might access: the folders under a grant to one of them, and the folders nothing is
     * granted on, themselves or above (public ones). Folders matching `paths` are added.
     */
    listCandidateIds(folderModel: CmsModel, params: ListCandidateIdsParams): Promise<string[]>;
    /** The folder types the tenant has folders of. */
    listTypes(folderModel: CmsModel): Promise<string[]>;
}

export const FolderCatalog = createAbstraction<IFolderCatalog>("Aco/Pg/FolderCatalog");

export namespace FolderCatalog {
    export type Interface = IFolderCatalog;
}

const BUILD_LOCK = "aco_folder_catalog:";
/** Rows per INSERT while building: well under Postgres's 65,535 bind parameters (7 per folder). */
const BUILD_CHUNK = 1000;

/** A text array as one parameter: knex expands a JS array into a list of parameters. */
const textArray = (values: string[]): string => {
    const items = values.map(value => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
    return `{${items.join(",")}}`;
};

const createPath = (slug: string, parentPath?: string): string => {
    return parentPath ? `${parentPath}/${slug}` : `${ROOT_FOLDER}/${slug}`;
};

class FolderCatalogImpl implements FolderCatalog.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: FolderCatalogSchema.Interface,
        private readonly pgSchema: PgSchema.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface,
        private readonly patcher: EntryValuesPatcher.Interface
    ) {}

    public async sync(
        trx: Knex.Transaction,
        folderModel: CmsModel,
        entryIds: string[]
    ): Promise<string[]> {
        if (entryIds.length === 0) {
            return [];
        }
        // Inside the write transaction: a second connection may never come on a small pool.
        await this.schema.ensureIn(trx);
        // A catalog built now reads the entries as this transaction wrote them: nothing to sync.
        if (await this.ensureBuilt(trx, folderModel)) {
            return [];
        }

        const tenant = folderModel.tenant;
        const sources = await this.readSources(trx, folderModel, entryIds);
        const patched = new Set<string>();
        for (const id of entryIds) {
            const source = sources.get(id);
            if (source) {
                for (const patchedId of await this.upsert(trx, folderModel, source)) {
                    patched.add(patchedId);
                }
            } else {
                await this.remove(trx, tenant, id);
            }
        }
        return Array.from(patched);
    }

    public async getEffective(
        folderModel: CmsModel,
        ids: string[]
    ): Promise<Map<string, FolderLevelPermission>> {
        const result = new Map<string, FolderLevelPermission>();
        if (ids.length === 0) {
            return result;
        }
        const db = await this.readyClient(folderModel);
        const { folders, grants } = this.schema.getTables();
        const tenant = folderModel.tenant;

        const rows: FolderRow[] = (
            await db.raw(`SELECT * FROM "${folders}" WHERE tenant = ? AND id = ANY(?::text[])`, [
                tenant,
                textArray(ids)
            ])
        ).rows;
        if (rows.length === 0) {
            return result;
        }

        // The folders and all their ancestors, with their own grants.
        const chainIds = Array.from(new Set(rows.flatMap(row => row.id_path)));
        const chain: FolderRow[] = (
            await db.raw(`SELECT * FROM "${folders}" WHERE tenant = ? AND id = ANY(?::text[])`, [
                tenant,
                textArray(chainIds)
            ])
        ).rows;
        const grantRows: GrantRow[] = (
            await db.raw(
                `SELECT folder_id, target, level FROM "${grants}"
                WHERE tenant = ? AND folder_id = ANY(?::text[])
                ORDER BY folder_id, position`,
                [tenant, textArray(chainIds)]
            )
        ).rows;

        const byId = new Map(chain.map(row => [row.id, row]));
        const explicit = new Map<string, FolderPermission[]>();
        for (const { folder_id, target, level } of grantRows) {
            const list = explicit.get(folder_id) ?? [];
            list.push({ target, level });
            explicit.set(folder_id, list);
        }

        /*
         * Same rule as the task-maintained catalog, which stores, for every folder,
         * `Permissions.create(own permissions, parent's stored permissions)`: worked out from the
         * root down instead of copied.
         */
        const effective = new Map<string, FolderPermission[]>();
        const resolve = (id: string): FolderPermission[] => {
            const known = effective.get(id);
            if (known) {
                return known;
            }
            const row = byId.get(id);
            const parentId = row?.parent_id;
            const parent =
                parentId && parentId !== ROOT_FOLDER && byId.has(parentId)
                    ? { id: parentId, permissions: resolve(parentId) }
                    : null;
            const permissions = Permissions.create(explicit.get(id) ?? [], parent);
            effective.set(id, permissions);
            return permissions;
        };

        for (const row of rows) {
            result.set(row.id, {
                id: row.id,
                type: row.type,
                slug: row.slug,
                parentId: row.parent_id ?? ROOT_FOLDER,
                path: row.slug_path,
                permissions: resolve(row.id)
            });
        }
        return result;
    }

    public async listIds(folderModel: CmsModel, params: ListFolderIdsParams): Promise<string[]> {
        const db = await this.readyClient(folderModel);
        const { folders } = this.schema.getTables();
        const query = db(folders)
            .select("id")
            .where({ tenant: folderModel.tenant, type: params.type });
        if (params.parentId) {
            query.andWhere("parent_id", params.parentId);
        }
        if (params.path_startsWith) {
            // `slug_path` is collated "C", so the (tenant, type, slug_path) index serves the prefix.
            query.andWhereRaw(`slug_path LIKE ? ESCAPE '\\'`, [
                `${params.path_startsWith.replace(/[\\%_]/g, m => `\\${m}`)}%`
            ]);
        }
        return (await query).map((row: { id: string }) => row.id);
    }

    public async listCandidateIds(
        folderModel: CmsModel,
        { type, parentId, targets, paths }: ListCandidateIdsParams
    ): Promise<string[]> {
        const db = await this.readyClient(folderModel);
        const { folders, grants } = this.schema.getTables();
        const tenant = folderModel.tenant;

        // Every branch is limited to the folders asked for.
        const scope = `f.tenant = ? AND f.type = ?${parentId ? " AND f.parent_id = ?" : ""}`;
        const scopeBindings = [tenant, type, ...(parentId ? [parentId] : [])];

        /*
         * Access to a folder that has permissions comes from a grant, other than `no-access`, to
         * one of the targets on the folder or above it (inherited grants are the ancestors'). The
         * targets' grants come from the grants-by-target index, and each one's subtree from the GIN
         * index on `id_path`, one lookup per grant: a single `&&` with all of them is planned as a
         * scan comparing every path with every grant. `folder_id` is collated "C", `id_path` is
         * not, and the index is only used when the two match.
         */
        const branches = [
            `SELECT f.id FROM "${grants}" g
            CROSS JOIN LATERAL (
                SELECT f.id FROM "${folders}" f
                WHERE f.id_path @> ARRAY[g.folder_id COLLATE "default"] AND ${scope}
            ) f
            WHERE g.tenant = ? AND g.target = ANY(?::text[]) AND g.level <> 'no-access'`,
            // Public: nothing granted on the folder or above it, by primary key per path element.
            `SELECT f.id FROM "${folders}" f
            WHERE ${scope} AND NOT EXISTS (
                SELECT 1 FROM unnest(f.id_path) AS p(id)
                JOIN "${grants}" g ON g.tenant = f.tenant AND g.folder_id = p.id
            )`
        ];
        const bindings: string[] = [...scopeBindings, tenant, textArray(targets), ...scopeBindings];

        // Granted in code: matched by path, as the code-defined rules are.
        const pathConditions: string[] = [];
        const pathBindings: string[] = [];
        for (const { base, subtree } of paths) {
            if (base === ROOT_FOLDER) {
                // "root/*" is every folder; "root" alone is no folder.
                if (subtree) {
                    pathConditions.push("TRUE");
                }
                continue;
            }
            pathConditions.push(
                subtree ? "(f.slug_path = ? OR starts_with(f.slug_path, ?))" : "f.slug_path = ?"
            );
            pathBindings.push(...(subtree ? [base, `${base}/`] : [base]));
        }
        if (pathConditions.length > 0) {
            branches.push(
                `SELECT f.id FROM "${folders}" f WHERE ${scope} AND (${pathConditions.join(" OR ")})`
            );
            bindings.push(...scopeBindings, ...pathBindings);
        }

        const rows: Array<{ id: string }> = (await db.raw(branches.join("\nUNION\n"), bindings))
            .rows;
        return rows.map(row => row.id);
    }

    public async listTypes(folderModel: CmsModel): Promise<string[]> {
        const db = await this.readyClient(folderModel);
        const { folders } = this.schema.getTables();
        const rows = await db(folders).distinct("type").where({ tenant: folderModel.tenant });
        return rows.map((row: { type: string }) => row.type);
    }

    /*
     * The tables exist and the tenant's catalog is built. A catalog is built once per tenant, from
     * the folder entries: on the first read or write after this storage is deployed. Until then no
     * permission could be read, and reading none would make every folder public.
     */
    private async readyClient(folderModel: CmsModel): Promise<Knex> {
        // Both before opening a transaction: each may need a connection of its own.
        await this.pgSchema.ensure();
        await this.schema.ensure();
        if (!this.schema.isKnownBuilt(folderModel.tenant)) {
            await this.knex.client.transaction(trx => this.ensureBuilt(trx, folderModel));
        }
        return this.knex.client;
    }

    /** Builds the tenant's catalog if it has not been built. Returns whether it built it now. */
    private async ensureBuilt(trx: Knex.Transaction, folderModel: CmsModel): Promise<boolean> {
        const tenant = folderModel.tenant;
        if (this.schema.isKnownBuilt(tenant)) {
            return false;
        }
        const { state } = this.schema.getTables();
        // One builder per tenant; the others wait and then find it built.
        await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [BUILD_LOCK + tenant]);
        const built = await trx(state).where({ tenant }).first();
        if (built) {
            this.schema.rememberBuilt(tenant);
            return false;
        }

        await this.build(trx, folderModel);
        await trx(state).insert({ tenant });
        /*
         * Remembered only once the transaction commits: a rolled-back build leaves no catalog, and
         * the next call has to build it again.
         */
        trx.executionPromise.then(() => this.schema.rememberBuilt(tenant)).catch(() => undefined);
        return true;
    }

    private async build(trx: Knex.Transaction, folderModel: CmsModel): Promise<void> {
        const sources = await this.readSources(trx, folderModel, null);
        const children = new Map<string | null, FolderSource[]>();
        for (const source of sources.values()) {
            const parentId =
                source.parentId && source.parentId !== ROOT_FOLDER && sources.has(source.parentId)
                    ? source.parentId
                    : null;
            const list = children.get(parentId) ?? [];
            list.push(source);
            children.set(parentId, list);
        }

        /*
         * Level by level from the roots down, in memory: every folder's row needs its parent's
         * paths. The tables start empty for the tenant, so the rows are written in a few multi-row
         * INSERTs, with no per-folder round trips and no grants to delete first.
         */
        const tenant = folderModel.tenant;
        const rows: FolderRow[] = [];
        const grantRows: Array<GrantRow & { tenant: string; position: number }> = [];
        let current: Array<{ source: FolderSource; parent: FolderRow | null }> = (
            children.get(null) ?? []
        ).map(source => ({ source, parent: null }));
        while (current.length > 0) {
            const next: typeof current = [];
            for (const { source, parent } of current) {
                const row = this.toRow(source, parent);
                rows.push(row);
                this.ownPermissions(source.permissions).forEach((permission, position) => {
                    grantRows.push({
                        tenant,
                        folder_id: row.id,
                        position,
                        target: permission.target,
                        level: permission.level
                    });
                });
                for (const child of children.get(source.id) ?? []) {
                    next.push({ source: child, parent: row });
                }
            }
            current = next;
        }

        const { folders, grants } = this.schema.getTables();
        for (let start = 0; start < rows.length; start += BUILD_CHUNK) {
            const chunk = rows.slice(start, start + BUILD_CHUNK);
            await trx.raw(
                `INSERT INTO "${folders}" (tenant, id, type, slug, parent_id, id_path, slug_path)
                VALUES ${chunk.map(() => "(?, ?, ?, ?, ?, ?::text[], ?)").join(", ")}`,
                chunk.flatMap(row => [
                    tenant,
                    row.id,
                    row.type,
                    row.slug,
                    row.parent_id,
                    textArray(row.id_path),
                    row.slug_path
                ])
            );
        }
        for (let start = 0; start < grantRows.length; start += BUILD_CHUNK) {
            await trx(grants).insert(grantRows.slice(start, start + BUILD_CHUNK));
        }
    }

    private async upsert(
        trx: Knex.Transaction,
        folderModel: CmsModel,
        source: FolderSource
    ): Promise<string[]> {
        const tenant = folderModel.tenant;
        const { folders } = this.schema.getTables();

        const existing: FolderRow | undefined = (
            await trx.raw(`SELECT * FROM "${folders}" WHERE tenant = ? AND id = ? FOR UPDATE`, [
                tenant,
                source.id
            ])
        ).rows[0];

        let parent: FolderRow | null = null;
        if (source.parentId && source.parentId !== ROOT_FOLDER) {
            parent = (
                await trx.raw(`SELECT * FROM "${folders}" WHERE tenant = ? AND id = ?`, [
                    tenant,
                    source.parentId
                ])
            ).rows[0];
            if (!parent) {
                throw new WebinyError(
                    `Parent folder "${source.parentId}" of folder "${source.id}" is not in the folder catalog.`,
                    "ACO_FOLDER_CATALOG_PARENT_NOT_FOUND",
                    { id: source.id, parentId: source.parentId }
                );
            }
            if (parent.id_path.includes(source.id)) {
                throw new WebinyError(
                    `Folder "${source.id}" cannot be moved into its own subtree.`,
                    "ACO_FOLDER_CATALOG_CYCLE",
                    { id: source.id, parentId: source.parentId }
                );
            }
        }

        const row = this.toRow(source, parent);
        if (!existing) {
            await this.insert(trx, tenant, row, source.permissions);
            return [];
        }

        await this.replaceGrants(trx, tenant, source.id, source.permissions);
        await trx(folders)
            .where({ tenant, id: source.id })
            .update({ type: row.type, slug: row.slug, parent_id: row.parent_id });

        const moved =
            existing.slug_path !== row.slug_path ||
            existing.id_path.length !== row.id_path.length ||
            existing.id_path.some((id, index) => id !== row.id_path[index]);
        if (!moved) {
            return [];
        }

        // The folder and every descendant get the new prefix, in one statement.
        const changed: Array<{ id: string; slug_path: string }> = (
            await trx.raw(
                `UPDATE "${folders}"
                SET id_path = ?::text[] || id_path[?::int + 1:],
                    slug_path = ? || substr(slug_path, ?::int + 1)
                WHERE tenant = ? AND id_path @> ARRAY[?]::text[]
                RETURNING id, slug_path`,
                [
                    textArray(row.id_path),
                    existing.id_path.length,
                    row.slug_path,
                    existing.slug_path.length,
                    tenant,
                    source.id
                ]
            )
        ).rows;

        // Their entries' `path` follows in the same transaction.
        return this.patcher.patch(
            trx,
            folderModel,
            changed.map(({ id, slug_path }) => ({ entryId: id, values: { path: slug_path } }))
        );
    }

    private async remove(trx: Knex.Transaction, tenant: string, id: string): Promise<void> {
        const { folders, grants } = this.schema.getTables();
        await trx(grants).where({ tenant, folder_id: id }).delete();
        await trx(folders).where({ tenant, id }).delete();
    }

    private async insert(
        trx: Knex.Transaction,
        tenant: string,
        row: FolderRow,
        permissions: FolderPermission[]
    ): Promise<void> {
        const { folders } = this.schema.getTables();
        await trx.raw(
            `INSERT INTO "${folders}" (tenant, id, type, slug, parent_id, id_path, slug_path)
            VALUES (?, ?, ?, ?, ?, ?::text[], ?)`,
            [
                tenant,
                row.id,
                row.type,
                row.slug,
                row.parent_id,
                textArray(row.id_path),
                row.slug_path
            ]
        );
        await this.replaceGrants(trx, tenant, row.id, permissions);
    }

    private async replaceGrants(
        trx: Knex.Transaction,
        tenant: string,
        folderId: string,
        permissions: FolderPermission[]
    ): Promise<void> {
        const { grants } = this.schema.getTables();
        await trx(grants).where({ tenant, folder_id: folderId }).delete();
        const own = this.ownPermissions(permissions);
        if (own.length === 0) {
            return;
        }
        await trx(grants).insert(
            own.map((permission, position) => ({
                tenant,
                folder_id: folderId,
                position,
                target: permission.target,
                level: permission.level
            }))
        );
    }

    /** Only the folder's own permissions; inherited ones are worked out when reading. */
    private ownPermissions(permissions: FolderPermission[]): FolderPermission[] {
        return permissions.filter(
            permission => !permission.plugin && !permission.inheritedFrom?.startsWith("parent:")
        );
    }

    private toRow(source: FolderSource, parent: FolderRow | null): FolderRow {
        return {
            id: source.id,
            type: source.type,
            slug: source.slug,
            parent_id: parent ? parent.id : ROOT_FOLDER,
            id_path: [...(parent?.id_path ?? []), source.id],
            slug_path: createPath(source.slug, parent?.slug_path)
        };
    }

    /** The latest, not deleted folder entries; all of the tenant's when `entryIds` is null. */
    private async readSources(
        db: Knex | Knex.Transaction,
        folderModel: CmsModel,
        entryIds: string[] | null
    ): Promise<Map<string, FolderSource>> {
        // The entries table exists: write paths ensured it, read paths did in readyClient().
        const { entries } = this.pgSchema.getTables();
        const query = db(entries).select("entry_id", "data").where({
            tenant: folderModel.tenant,
            model_id: folderModel.modelId,
            is_latest: true,
            wby_deleted: false
        });
        if (entryIds !== null) {
            query.whereRaw("entry_id = ANY(?::text[])", [textArray(entryIds)]);
        }
        const storageModel = this.storageModelProvider.getModel(folderModel);
        const sources = new Map<string, FolderSource>();
        for (const row of await query) {
            const entry = rowToEntry(row, storageModel);
            const values = entry.values as Record<string, any>;
            sources.set(row.entry_id, {
                id: row.entry_id,
                type: values.type,
                slug: values.slug,
                parentId: values.parentId ?? null,
                permissions: (values.permissions ?? []) as FolderPermission[]
            });
        }
        return sources;
    }
}

export const FolderCatalogImplementation = FolderCatalog.createImplementation({
    implementation: FolderCatalogImpl,
    dependencies: [
        KnexClient,
        FolderCatalogSchema,
        PgSchema,
        CmsStorageModelProvider,
        EntryValuesPatcher
    ]
});
