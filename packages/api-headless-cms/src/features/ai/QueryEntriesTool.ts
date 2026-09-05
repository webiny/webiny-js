import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { ListLatestEntriesUseCase } from "~/features/contentEntry/ListEntries/index.js";
import type { CmsEntryListParams } from "~/types/index.js";
import type { CmsEntryListSort } from "~/types/index.js";
import type { CmsEntryListWhere } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";

/**
 * Hard ceiling on returned entries. A model asking for "all products" would otherwise pull an entire
 * collection into the context window; the cursor in the response is the correct way to go deeper.
 */
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

const inputSchema = z.object({
    modelId: z.string().describe("Model ID as returned by listContentModels."),
    where: z
        .record(z.string(), z.unknown())
        .optional()
        .describe(
            "Flat filter object. Keys are `<fieldId>` for an exact match or `<fieldId>_<operator>` otherwise — e.g. { onSale: true, price_gt: 100, name_contains: 'desk', status: 'draft' }. Operators: _not, _in, _not_in, _lt, _lte, _gt, _gte, _contains, _not_contains, _startsWith, _not_startsWith, _between, _not_between. Mix the model's own fields with entry meta fields (id, entryId, status, createdOn, savedOn) freely — they are separated automatically. Use describeContentModel first so field IDs are real."
        ),
    sort: z
        .array(z.string())
        .optional()
        .describe(
            "Sort directives as `<fieldId>_ASC` or `<fieldId>_DESC` — e.g. ['price_DESC'] for a model field or ['savedOn_DESC'] for entry meta. Both forms are accepted; the distinction is handled automatically."
        ),
    search: z
        .string()
        .optional()
        .describe("Full-text search across the model's searchable fields."),
    fields: z
        .array(z.string())
        .optional()
        .describe(
            "Restrict returned values to these field IDs. Use it whenever you only need a few fields — entries can be large."
        ),
    limit: z
        .number()
        .int()
        .positive()
        .optional()
        .describe(
            `Maximum entries to return. Defaults to ${DEFAULT_LIMIT}, capped at ${MAX_LIMIT}.`
        ),
    after: z.string().optional().describe("Pagination cursor from a previous call's meta.cursor.")
});

type Input = z.infer<typeof inputSchema>;

interface EntrySummary {
    id: string;
    entryId: string;
    status: string;
    createdOn: string;
    savedOn: string;
    values: Record<string, unknown>;
}

interface QueryEntriesResult {
    modelId: string;
    entries: EntrySummary[];
    meta: {
        totalCount: number;
        hasMoreItems: boolean;
        cursor: string | null;
    };
}

/**
 * The CMS splits `where` into two levels: entry meta fields (id, status, savedOn, ...) sit at the top,
 * while the model's own fields must be nested under `values`. An LLM has no way to know that — and
 * `describeContentModel` hands it a FLAT list of fieldIds, so a flat filter is exactly what it writes.
 * Rather than documenting the split and hoping, we accept the flat form and route each key by whether
 * its field belongs to the model.
 *
 * A key is `<fieldId>` or `<fieldId>_<operator>`; the longest matching fieldId wins, so a model with
 * both `price` and `price_range` cannot be mis-routed. `AND`/`OR` are passed through untouched — they
 * carry nested filter objects, not field references.
 */
const LOGICAL_KEYS = new Set(["AND", "OR"]);

const splitWhere = (where: Record<string, unknown>, model: CmsModel): Record<string, unknown> => {
    const fieldIds = model.fields.map(field => field.fieldId).sort((a, b) => b.length - a.length);

    const top: Record<string, unknown> = {};
    const values: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(where)) {
        if (LOGICAL_KEYS.has(key)) {
            top[key] = value;
            continue;
        }

        // An explicitly nested `values` object is respected as-is — a caller that already knows the
        // shape should not be second-guessed.
        if (key === "values" && typeof value === "object" && value !== null) {
            Object.assign(values, value as Record<string, unknown>);
            continue;
        }

        const matched = fieldIds.find(fieldId => key === fieldId || key.startsWith(`${fieldId}_`));

        if (matched) {
            values[key] = value;
        } else {
            top[key] = value;
        }
    }

    if (Object.keys(values).length > 0) {
        top["values"] = values;
    }

    return top;
};

/**
 * Sort has the same two-level split as `where`, with a different spelling: the CMS sorter for a model
 * field is `values_<fieldId>_<DIR>`, while entry meta fields sort as `<fieldId>_<DIR>`. Callers give us
 * the flat `<fieldId>_<DIR>` form (that is what describeContentModel's field IDs invite), so prefix the
 * ones that name a model field and leave the rest alone.
 */
const mapSort = (sort: string[], model: CmsModel): string[] => {
    const fieldIds = new Set(model.fields.map(field => field.fieldId));

    return sort.map(directive => {
        const match = /^(.*)_(ASC|DESC)$/.exec(directive);
        if (!match) {
            return directive;
        }

        const [, field, direction] = match;
        return fieldIds.has(field) ? `values_${field}_${direction}` : directive;
    });
};

/**
 * Reads entries for one model.
 *
 * Uses the LATEST revisions (the manage-API view), not published ones — an editor asking "which
 * products are discounted" means the content as it currently stands in the admin app, including
 * unpublished edits. Filter on `status` for a published-only view.
 *
 * `where` is passed through to the CMS rather than re-modelled as a Zod schema: the valid keys depend
 * entirely on the model's fields, which are only known at runtime. An invalid filter surfaces as a
 * tool error the model can correct, which is why `describeContentModel` is named in the description.
 */
class QueryEntriesToolImpl implements IAiSdkTool<Input> {
    readonly name = "queryEntries";
    readonly title = "Query content entries";
    readonly description =
        "Queries content entries for a model, with filtering, sorting, search and pagination. Returns the latest revision of each entry (including unpublished changes). Call describeContentModel first to learn the field IDs used in `where` and `sort`.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: true };

    constructor(
        private getModel: GetModelUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface
    ) {}

    async execute(input: Input): Promise<QueryEntriesResult> {
        const modelResult = await this.getModel.execute(input.modelId);

        if (modelResult.isFail()) {
            throw new Error(
                `Unknown model "${input.modelId}": ${modelResult.error.message}. Call listContentModels for valid model IDs.`
            );
        }

        const params: CmsEntryListParams = {
            limit: Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
        };

        if (input.where) {
            params.where = splitWhere(input.where, modelResult.value) as CmsEntryListWhere;
        }

        if (input.sort?.length) {
            params.sort = mapSort(input.sort, modelResult.value) as CmsEntryListSort;
        }

        if (input.search) {
            params.search = input.search;
        }

        if (input.fields?.length) {
            params.fields = input.fields;
        }

        if (input.after) {
            params.after = input.after;
        }

        const result = await this.listLatestEntries.execute(modelResult.value, params);

        if (result.isFail()) {
            throw new Error(`Could not query "${input.modelId}" entries: ${result.error.message}`);
        }

        const { entries, meta } = result.value;

        return {
            modelId: input.modelId,
            entries: entries.map(entry => ({
                id: entry.id,
                entryId: entry.entryId,
                status: entry.status,
                createdOn: entry.createdOn,
                savedOn: entry.savedOn,
                values: entry.values
            })),
            meta: {
                totalCount: meta.totalCount,
                hasMoreItems: meta.hasMoreItems,
                cursor: meta.cursor
            }
        };
    }
}

export const QueryEntriesTool = AiSdkTool.createImplementation({
    implementation: QueryEntriesToolImpl,
    dependencies: [GetModelUseCase, ListLatestEntriesUseCase]
});
