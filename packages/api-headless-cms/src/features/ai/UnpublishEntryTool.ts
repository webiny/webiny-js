import { z } from "zod";
import { AiSdkToolDefinition, AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { GetPublishedRevisionByEntryIdUseCase } from "~/features/contentEntry/GetPublishedRevisionByEntryId/index.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/UnpublishEntry/index.js";
import { NotifyEntryChangeUseCase } from "./NotifyEntryChange/index.js";
import { getWritableModel } from "./models.js";
import { toEntrySummary, type EntrySummary } from "./entrySummary.js";

const inputSchema = z.object({
    modelId: z.string().describe("Model ID as returned by listContentModels."),
    entryId: z.string().describe("The entry's `entryId` as returned by queryEntries.")
});

type Input = z.infer<typeof inputSchema>;

/** Takes the published revision offline. The entry and its revisions stay. */
class UnpublishEntryToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private getPublishedRevision: GetPublishedRevisionByEntryIdUseCase.Interface,
        private unpublishEntry: UnpublishEntryUseCase.Interface,
        private notifyEntryChange: NotifyEntryChangeUseCase.Interface
    ) {}

    async execute(input: Input): Promise<EntrySummary> {
        const model = await getWritableModel(this.getModel, input.modelId);

        const published = await this.getPublishedRevision.execute(model, input.entryId);

        // An entry with no published revision reads as not found, or as `null`.
        if (published.isFail() && published.error.code !== "Cms/Entry/NotFound") {
            throw new Error(`Could not read entry "${input.entryId}": ${published.error.message}`);
        }

        const revision = published.isOk() ? published.value : null;
        if (!revision) {
            throw new Error(`Entry "${input.entryId}" is not published. Nothing was changed.`);
        }

        const result = await this.unpublishEntry.execute(model, revision.id);
        if (result.isFail()) {
            throw new Error(`Could not unpublish the entry: ${result.error.message}`);
        }

        const entry = result.value;
        await this.notifyEntryChange.execute({
            modelId: model.modelId,
            entryId: entry.entryId,
            change: "updated"
        });

        return toEntrySummary(entry);
    }
}

const UnpublishEntryToolHandler = AiSdkToolHandler.createImplementation({
    implementation: UnpublishEntryToolHandlerImpl,
    dependencies: [
        GetModelUseCase,
        GetPublishedRevisionByEntryIdUseCase,
        UnpublishEntryUseCase,
        NotifyEntryChangeUseCase
    ]
});

/** Takes an entry offline. Needs approval: it changes what the website shows. */
class UnpublishEntryToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "unpublishEntry";
    readonly title = "Unpublish entry";
    readonly description =
        "Unpublishes one content entry, taking it offline. The entry and its content stay and can be published again. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false, idempotentHint: true };
    readonly handler = UnpublishEntryToolHandler;
}

export const UnpublishEntryTool = AiSdkToolDefinition.createImplementation({
    implementation: UnpublishEntryToolImpl,
    dependencies: []
});
