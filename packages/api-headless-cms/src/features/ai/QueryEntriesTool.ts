import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { ListLatestEntriesUseCase } from "~/features/contentEntry/ListEntries/index.js";
import { CmsWhereMapper } from "~/features/whereMapper/abstractions.js";
import { CmsSortMapper } from "~/features/sortMapper/abstractions.js";
import type { CmsEntryListParams } from "~/types/index.js";
import type { CmsEntryListSort } from "~/types/index.js";

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
 * Reads entries for one model.
 *
 * Uses the LATEST revisions (the manage-API view), not published ones — an editor asking "which
 * products are discounted" means the content as it currently stands in the admin app, including
 * unpublished edits. Filter on `status` for a published-only view.
 *
 * `where` is passed through to the CMS rather than re-modelled as a Zod schema: the valid keys depend
 * entirely on the model's fields, which are only known at runtime. An invalid filter surfaces as a
 * tool error the model can correct, which is why `describeContentModel` is named in the description.
 *
 * `where` and `sort` arrive FLAT and go through `CmsWhereMapper`/`CmsSortMapper`, which nest the
 * model's own fields under `values` and leave entry meta at the top. The flat form is what a model
 * writes, because `describeContentModel` hands it a flat list of fieldIds.
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
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private whereMapper: CmsWhereMapper.Interface,
        private sortMapper: CmsSortMapper.Interface
    ) {}

    async execute(input: Input): Promise<QueryEntriesResult> {
        const modelResult = await this.getModel.execute(input.modelId);

        if (modelResult.isFail()) {
            throw new Error(
                `Unknown model "${input.modelId}": ${modelResult.error.message}. Call listContentModels for valid model IDs.`
            );
        }

        const model = modelResult.value;

        const params: CmsEntryListParams = {
            limit: Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
        };

        if (input.where) {
            const where = this.whereMapper.map({ fields: model.fields, input: input.where });

            if (where) {
                params.where = where;
            }
        }

        if (input.sort?.length) {
            /*
             * `CmsEntryListSort` is a template-literal type, while the schema yields plain strings
             * because a model writes whatever it likes. Casting here is safe only because of the
             * check below, which refuses the call if the mapper could not read every directive.
             */
            const requested = input.sort as CmsEntryListSort;
            const sort = this.sortMapper.map({ fields: model.fields, input: requested });

            /*
             * The mapper drops a directive it cannot parse. Silence is the wrong answer here: the
             * query would run unsorted and the model would present the result as sorted. Comparing
             * lengths rather than re-checking the format keeps this in step with whatever the mapper
             * accepts.
             */
            if (!sort || sort.length !== input.sort.length) {
                throw new Error(
                    `Could not read every sort directive in [${input.sort.join(", ")}]. Each one must be \`<fieldId>_ASC\` or \`<fieldId>_DESC\`, using a field ID from describeContentModel.`
                );
            }

            params.sort = sort;
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

        const result = await this.listLatestEntries.execute(model, params);

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
    dependencies: [GetModelUseCase, ListLatestEntriesUseCase, CmsWhereMapper, CmsSortMapper]
});
