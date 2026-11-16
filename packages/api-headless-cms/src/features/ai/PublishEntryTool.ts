import { z } from "zod";
import { AiSdkToolDefinition, AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/index.js";
import { NotifyRecordChangeUseCase } from "@webiny/api-core/features/websockets/index.js";
import { ENTRY_RECORD_TYPE } from "~/features/contentEntry/NotifyEntryChange/index.js";
import { getLatestEntryRevision } from "./models.js";
import { getWritableModel } from "./models.js";
import { toEntrySummary, type EntrySummary } from "./entrySummary.js";

const inputSchema = z.object({
    modelId: z.string().describe("Model ID as returned by listContentModels."),
    entryId: z.string().describe("The entry's `entryId` as returned by queryEntries.")
});

type Input = z.infer<typeof inputSchema>;

/** Publishes the latest revision, which is what the admin's Publish button does. */
class PublishEntryToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private publishEntry: PublishEntryUseCase.Interface,
        private notifyRecordChange: NotifyRecordChangeUseCase.Interface
    ) {}

    async execute(input: Input): Promise<EntrySummary> {
        const model = await getWritableModel(this.getModel, input.modelId);

        const latest = await getLatestEntryRevision(this.getLatestRevision, model, input.entryId);

        if (latest.status === "published") {
            throw new Error(`Entry "${input.entryId}" is already published. Nothing was changed.`);
        }

        const result = await this.publishEntry.execute(model, latest.id);
        if (result.isFail()) {
            throw new Error(`Could not publish the entry: ${result.error.message}`);
        }

        const entry = result.value;
        await this.notifyRecordChange.execute({
            type: ENTRY_RECORD_TYPE,
            id: entry.entryId,
            scope: model.modelId,
            change: "updated"
        });

        return toEntrySummary(entry);
    }
}

const PublishEntryToolHandler = AiSdkToolHandler.createImplementation({
    implementation: PublishEntryToolHandlerImpl,
    dependencies: [
        GetModelUseCase,
        GetLatestRevisionByEntryIdUseCase,
        PublishEntryUseCase,
        NotifyRecordChangeUseCase
    ]
});

/** Makes the entry's latest revision live. Needs approval: it changes what the website shows. */
class PublishEntryToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "publishEntry";
    readonly title = "Publish entry";
    readonly description =
        "Publishes the latest revision of one content entry, making it live. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false, idempotentHint: true };
    readonly handler = PublishEntryToolHandler;
}

export const PublishEntryTool = AiSdkToolDefinition.createImplementation({
    implementation: PublishEntryToolImpl,
    dependencies: []
});
