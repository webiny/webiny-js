import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { ListModelsUseCase } from "~/features/contentModel/ListModels/index.js";
import type { CmsModel } from "~/types/index.js";

const HIDDEN_MODEL_GROUP = "hidden";

const inputSchema = z.object({
    includeSystem: z
        .boolean()
        .optional()
        .describe(
            "Include system models that back Webiny itself (languages, tenants, task settings) and internal models belonging to other apps. Off by default — these are never what a user means by 'content'."
        )
});

type Input = z.infer<typeof inputSchema>;

interface ModelSummary {
    modelId: string;
    name: string;
    description: string | null;
    group: string;
    singularApiName: string;
    pluralApiName: string;
    titleFieldId: string;
    fieldCount: number;
}

/**
 * Models Webiny itself owns. Two separate markers, both needed:
 *  - `group: "hidden"` — the convention system models use (languages, tenants, background-task
 *    settings). The admin UI filters the same way, see app-headless-cms useCmsData.
 *  - `isPrivate` — models another app owns and manages through its own UI (e.g. Website Builder).
 */
const isSystemModel = (model: CmsModel): boolean =>
    Boolean(model.isPrivate) || model.group === HIDDEN_MODEL_GROUP;

/**
 * Entry point for any content question. The CMS schema is defined per project (and per tenant), so a
 * model list cannot be baked into a system prompt — it has to be discovered at call time. Returns a
 * summary only; `describeContentModel` supplies the field detail needed to actually build a query.
 */
class ListContentModelsToolImpl implements IAiSdkTool<Input> {
    readonly name = "listContentModels";
    readonly title = "List content models";
    readonly description =
        "Lists the content models available in this project. Call this first when you need to find content — model IDs are project-specific and cannot be guessed. Returns a summary per model; use describeContentModel for field details.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: true, idempotentHint: true };

    constructor(private listModels: ListModelsUseCase.Interface) {}

    async execute(input: Input): Promise<ModelSummary[]> {
        const result = await this.listModels.execute();

        if (result.isFail()) {
            throw new Error(`Could not list content models: ${result.error.message}`);
        }

        return result.value
            .filter(model => (input.includeSystem ? true : !isSystemModel(model)))
            .map(model => ({
                modelId: model.modelId,
                name: model.name,
                description: model.description,
                group: model.group,
                singularApiName: model.singularApiName,
                pluralApiName: model.pluralApiName,
                titleFieldId: model.titleFieldId,
                fieldCount: model.fields.length
            }));
    }
}

export const ListContentModelsTool = AiSdkTool.createImplementation({
    implementation: ListContentModelsToolImpl,
    dependencies: [ListModelsUseCase]
});
