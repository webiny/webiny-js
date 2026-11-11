import type { Knex } from "knex";
import { WebinyError } from "@webiny/error";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { EntryValuesPatcher as Abstraction } from "./abstractions.js";
import { PgSchema } from "~/features/schema/abstractions.js";

class EntryValuesPatcherImpl implements Abstraction.Interface {
    public constructor(
        private readonly schema: PgSchema.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    public async patch(
        trx: Knex.Transaction,
        model: CmsModel,
        patches: Abstraction.Patch[]
    ): Promise<string[]> {
        if (patches.length === 0) {
            return [];
        }
        const { entries } = this.schema.getTables();
        const storageModel = this.storageModelProvider.getModel(model);

        // One statement per field; each carries all of its entries as one jsonb parameter.
        const byField = new Map<string, Array<{ entry_id: string; value: unknown }>>();
        for (const { entryId, values } of patches) {
            for (const [fieldId, value] of Object.entries(values)) {
                const list = byField.get(fieldId) ?? [];
                list.push({ entry_id: entryId, value: value ?? null });
                byField.set(fieldId, list);
            }
        }

        for (const [fieldId, rows] of byField) {
            const field = storageModel.fields.find(f => f.fieldId === fieldId);
            if (!field) {
                throw new WebinyError(
                    `Model "${model.modelId}" has no field "${fieldId}" to patch.`,
                    "PG_PATCH_UNKNOWN_FIELD",
                    { modelId: model.modelId, fieldId }
                );
            }
            await trx.raw(
                `UPDATE "${entries}" AS e
                SET data = jsonb_set(e.data, ARRAY['values', ?]::text[], v.value, true)
                FROM jsonb_to_recordset(?::jsonb) AS v(entry_id text, value jsonb)
                WHERE e.tenant = ? AND e.model_id = ? AND e.entry_id = v.entry_id
                    AND (e.is_latest OR e.is_published)`,
                [field.storageId, JSON.stringify(rows), model.tenant, model.modelId]
            );
        }

        return Array.from(new Set(patches.map(p => p.entryId)));
    }
}

export const EntryValuesPatcherImplementation = Abstraction.createImplementation({
    implementation: EntryValuesPatcherImpl,
    dependencies: [PgSchema, CmsStorageModelProvider]
});
