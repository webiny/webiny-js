import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";

/**
 * Single-table mirror of the DynamoDB layout used by Webiny's `*-ddb` storage
 * operations. Every entity (CMS entries, tenants, users, settings, locks…)
 * lives in this one table, addressed by `(pk, sk)`.
 *
 * Multi-tenancy is preserved automatically because the tenant is part of `pk`
 * — every storage-operations query is naturally tenant-scoped without needing
 * an explicit `WHERE tenant_id = ?` predicate.
 *
 * GSI columns mirror the global secondary indexes from DynamoDB:
 *   - `gsi1`         — primary lookup index used by most CRUD operations
 *   - `gsi_tenant`   — cross-entity tenant lookups
 *
 * The `data` column holds the rest of the item body as JSON (matches DDB's
 * native JSON storage for non-key attributes). `version` is the optimistic-
 * concurrency counter used for safe upserts. `expires_at` mirrors DynamoDB
 * TTL — rows past this timestamp are filtered at query time.
 */
export const items = sqliteTable(
    "items",
    {
        pk: text("pk").notNull(),
        sk: text("sk").notNull(),
        gsi1Pk: text("gsi1_pk"),
        gsi1Sk: text("gsi1_sk"),
        gsiTenantPk: text("gsi_tenant_pk"),
        gsiTenantSk: text("gsi_tenant_sk"),
        data: text("data", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
        version: integer("version").notNull().default(0),
        // Unix epoch seconds, matching DynamoDB TTL semantics. Null = no expiry.
        expiresAt: integer("expires_at")
    },
    table => ({
        pk_sk: primaryKey({ columns: [table.pk, table.sk] }),
        gsi1_idx: index("idx_items_gsi1").on(table.gsi1Pk, table.gsi1Sk),
        gsi_tenant_idx: index("idx_items_gsi_tenant").on(table.gsiTenantPk, table.gsiTenantSk),
        // Partial index for TTL sweeps — only rows that actually have an
        // expiry get indexed.
        ttl_idx: index("idx_items_expires_at")
            .on(table.expiresAt)
            .where(sql`${table.expiresAt} IS NOT NULL`)
    })
);

export type ItemRow = typeof items.$inferSelect;
export type NewItemRow = typeof items.$inferInsert;
