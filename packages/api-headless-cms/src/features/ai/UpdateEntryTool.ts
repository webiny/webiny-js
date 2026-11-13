import { z } from "zod";
import { AiSdkToolDefinition, AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/UpdateEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "~/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { NotifyRecordChangeUseCase } from "@webiny/api-core/features/websockets/index.js";
import { ENTRY_RECORD_TYPE } from "~/features/contentEntry/NotifyEntryChange/index.js";
import { assertKnownFields } from "./assertKnownFields.js";
import { getLatestEntryRevision } from "./models.js";
import { getWritableModel } from "./models.js";
import { toEntrySummary, type EntrySummary } from "./entrySummary.js";

const inputSchema = z.object({
    modelId: z.string().describe("Model ID as returned by listContentModels."),
    entryId: z.string().describe("The entry's `entryId` as returned by queryEntries."),
    values: z
        .record(z.string(), z.unknown())
        .describe(
            "Only the fields to change, keyed by field ID from describeContentModel. Fields left out keep their current values."
        )
});

type Input = z.infer<typeof inputSchema>;

/*
 * Changes the latest revision. A published (locked) revision cannot be changed, so in that case a
 * new draft revision is created from it with the new values, which is what the admin's editor does
 * when you save a published entry. The published content stays live until that draft is published.
 */
class UpdateEntryToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private createRevisionFrom: CreateEntryRevisionFromUseCase.Interface,
        private notifyRecordChange: NotifyRecordChangeUseCase.Interface
    ) {}

    async execute(input: Input): Promise<EntrySummary & { newRevision: boolean }> {
        const model = await getWritableModel(this.getModel, input.modelId);
        assertKnownFields(model, input.values);

        const revision = await getLatestEntryRevision(this.getLatestRevision, model, input.entryId);

        const newRevision = Boolean(revision.locked);

        const result = newRevision
            ? await this.createRevisionFrom.execute(model, revision.id, { values: input.values })
            : await this.updateEntry.execute(model, revision.id, { values: input.values });

        if (result.isFail()) {
            throw new Error(`Could not update the entry: ${result.error.message}`);
        }

        const entry = result.value;
        await this.notifyRecordChange.execute({
            type: ENTRY_RECORD_TYPE,
            id: entry.entryId,
            scope: model.modelId,
            change: "updated"
        });

        return { ...toEntrySummary(entry), newRevision };
    }
}

const UpdateEntryToolHandler = AiSdkToolHandler.createImplementation({
    implementation: UpdateEntryToolHandlerImpl,
    dependencies: [
        GetModelUseCase,
        GetLatestRevisionByEntryIdUseCase,
        UpdateEntryUseCase,
        CreateEntryRevisionFromUseCase,
        NotifyRecordChangeUseCase
    ]
});

/** Changes some fields of one entry. Needs approval; the approval shows exactly which fields. */
class UpdateEntryToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "updateEntry";
    readonly title = "Update entry";
    readonly description =
        "Changes some field values of one content entry, leaving the other fields as they are. If the entry is published, the change goes into a new draft revision and the published version stays live until publishEntry is called. Call describeContentModel for field IDs and queryEntries for the entryId. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false, idempotentHint: true };
    readonly handler = UpdateEntryToolHandler;
}

export const UpdateEntryTool = AiSdkToolDefinition.createImplementation({
    implementation: UpdateEntryToolImpl,
    dependencies: []
});
