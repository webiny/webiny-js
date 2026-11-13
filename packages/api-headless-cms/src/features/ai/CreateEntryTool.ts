import { z } from "zod";
import { AiSdkToolDefinition, AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { NotifyEntryChangeUseCase } from "~/features/contentEntry/NotifyEntryChange/index.js";
import { assertKnownFields, getWritableModel } from "./models.js";
import { toEntrySummary, type EntrySummary } from "./entrySummary.js";

const inputSchema = z.object({
    modelId: z.string().describe("Model ID as returned by listContentModels."),
    values: z
        .record(z.string(), z.unknown())
        .describe(
            "Field values keyed by field ID from describeContentModel, e.g. { title: 'Desk lamp', price: 49 }. Fields left out stay empty."
        ),
    folderId: z
        .string()
        .optional()
        .describe(
            "Folder to create the entry in, as returned by listFolders. Omit it for the root."
        )
});

type Input = z.infer<typeof inputSchema>;

class CreateEntryToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private notifyEntryChange: NotifyEntryChangeUseCase.Interface
    ) {}

    async execute(input: Input): Promise<EntrySummary> {
        const model = await getWritableModel(this.getModel, input.modelId);
        assertKnownFields(model, input.values);

        const result = await this.createEntry.execute(model, {
            values: input.values,
            location: input.folderId ? { folderId: input.folderId } : undefined
        });

        if (result.isFail()) {
            throw new Error(`Could not create the entry: ${result.error.message}`);
        }

        const entry = result.value;
        await this.notifyEntryChange.execute({
            modelId: model.modelId,
            entryId: entry.entryId,
            change: "created"
        });

        return toEntrySummary(entry);
    }
}

const CreateEntryToolHandler = AiSdkToolHandler.createImplementation({
    implementation: CreateEntryToolHandlerImpl,
    dependencies: [GetModelUseCase, CreateEntryUseCase, NotifyEntryChangeUseCase]
});

/**
 * Creates one entry as a draft. Publishing is a separate call, so the user approves the content and
 * the publish on their own.
 */
class CreateEntryToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "createEntry";
    readonly title = "Create entry";
    readonly description =
        "Creates one content entry as an unpublished draft. Call describeContentModel first so `values` uses real field IDs and fills the required fields. Publish it afterwards with publishEntry if the user asked for that. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };
    readonly handler = CreateEntryToolHandler;
}

export const CreateEntryTool = AiSdkToolDefinition.createImplementation({
    implementation: CreateEntryToolImpl,
    dependencies: []
});
