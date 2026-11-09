import type { Knex } from "knex";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { KnexClient } from "@webiny/api-core-sql";
import { ScopeIndexMode as Abstraction } from "./abstractions.js";
import type { IndexMode } from "./indexMode.js";
import { getModeTtlMs, MODE_LOCK_SQL } from "./indexMode.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import { ScopeRegistry } from "~/features/scopes/abstractions.js";
import { SqlFragment } from "~/features/search/SqlFragment.js";

/* Rows flagged per statement, so a big model never holds row locks for long. */
const FLAG_BATCH = 2000;
/* Added to the mode TTL before demoted rows are unflagged, for clock skew and slow requests. */
const TTL_MARGIN_MS = 5000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ScopeIndexModeImpl implements Abstraction.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly scopes: ScopeRegistry.Interface
    ) {}

    public async getMode(model: CmsModel): Promise<IndexMode> {
        const { scopeId } = await this.scopes.get(model);
        return this.readMode(scopeId);
    }

    public async promote(model: CmsModel): Promise<void> {
        const { scopeId } = await this.scopes.get(model);
        // Waits for in-flight writes of the scope (they hold the mode lock shared); later writes
        // already flag their rows, so the batches below see every row.
        const started = await this.switchMode(scopeId, ["lean", "demoting"], "promoting");
        if (!started && (await this.readMode(scopeId)) !== "promoting") {
            return;
        }
        await this.flagRows(scopeId, true);
        await this.switchMode(scopeId, ["promoting"], "indexed");
        this.scopes.forget(model);
    }

    public async demote(model: CmsModel): Promise<void> {
        const { scopeId } = await this.scopes.get(model);
        const started = await this.switchMode(scopeId, ["indexed", "promoting"], "demoting");
        if (!started && (await this.readMode(scopeId)) !== "demoting") {
            return;
        }
        this.scopes.forget(model);
        // Other processes may still add `ix` for this scope from a cached mode until it expires.
        await sleep(getModeTtlMs() + TTL_MARGIN_MS);
        if (!(await this.switchMode(scopeId, ["demoting"], "lean"))) {
            return;
        }
        await this.flagRows(scopeId, false);
        this.scopes.forget(model);
    }

    public async evaluate(model: CmsModel, thresholds: Abstraction.Thresholds): Promise<IndexMode> {
        const { scopeId } = await this.scopes.get(model);
        const mode = await this.readMode(scopeId);
        // Counting stops at the promotion threshold, so a big model costs at most that many rows.
        const { search } = this.schema.getTables();
        const result = await this.knex.client.raw(
            `SELECT count(*)::int AS total FROM (SELECT 1 FROM "${search}" WHERE scope_id = ? AND view = 1 LIMIT ?) x`,
            [scopeId, thresholds.promoteAt]
        );
        const rows: number = result.rows[0].total;
        if (mode === "lean" && rows >= thresholds.promoteAt) {
            await this.promote(model);
            return "indexed";
        }
        if (mode === "indexed" && rows < thresholds.demoteAt) {
            await this.demote(model);
            return "lean";
        }
        return mode;
    }

    private async readMode(scopeId: number): Promise<IndexMode> {
        const { scopes } = this.schema.getTables();
        const result = await this.knex.client.raw(
            `SELECT index_mode FROM "${scopes}" WHERE scope_id = ?`,
            [scopeId]
        );
        return result.rows[0].index_mode;
    }

    private async switchMode(scopeId: number, from: IndexMode[], to: IndexMode): Promise<boolean> {
        const { scopes } = this.schema.getTables();
        const modes = SqlFragment.textArray(from);
        return this.knex.client.transaction(async trx => {
            // Same lock order as writes: the scope row (taken by a write that adds slots), then the
            // mode lock. The opposite order could deadlock with such a write.
            await trx.raw(`SELECT 1 FROM "${scopes}" WHERE scope_id = ? FOR UPDATE`, [scopeId]);
            await trx.raw(MODE_LOCK_SQL, [scopes, scopeId]);
            const result = await trx.raw(
                `UPDATE "${scopes}" SET index_mode = ? WHERE scope_id = ? AND index_mode = ANY(${modes.sql})`,
                [to, scopeId, ...modes.bindings] as Knex.RawBinding[]
            );
            return result.rowCount > 0;
        });
    }

    private async flagRows(scopeId: number, ix: boolean): Promise<void> {
        const { search } = this.schema.getTables();
        for (;;) {
            const result = await this.knex.client.raw(
                `UPDATE "${search}" SET ix = ? WHERE (scope_id, view, entry_id) IN (
                    SELECT scope_id, view, entry_id FROM "${search}"
                    WHERE scope_id = ? AND ix <> ? LIMIT ?
                )`,
                [ix, scopeId, ix, FLAG_BATCH]
            );
            if (result.rowCount === 0) {
                return;
            }
        }
    }
}

export const ScopeIndexModeImplementation = Abstraction.createImplementation({
    implementation: ScopeIndexModeImpl,
    dependencies: [KnexClient, PgSchema, ScopeRegistry]
});
