import { z } from "zod";
import { AiSdkToolDefinition, AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { MoveEntryToBinUseCase } from "~/features/contentEntry/DeleteEntry/index.js";
import { NotifyEntryChangeUseCase } from "./NotifyEntryChange/index.js";
import { getWritableModel } from "./models.js";

const inputSchema = z.object({
    modelId: z.string().describe("Model ID as returned by listContentModels."),
    entryId: z.string().describe("The entry's `entryId` as returned by queryEntries."),
    title: z
        .string()
        .describe(
            "The entry's current title (the value of the model's title field), exactly as queryEntries returned it. The delete is refused if it does not match."
        )
});

type Input = z.infer<typeof inputSchema>;

interface DeletedEntry {
    entryId: string;
    title: string;
}

/*
 * Moves the entry to the trash bin, never deletes it permanently, so it can be restored from the
 * admin. The title is in the input so the approval shows which entry goes rather than an id; it is
 * checked against the stored entry, so what the user approved by name is what is removed.
 */
class DeleteEntryToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private moveEntryToBin: MoveEntryToBinUseCase.Interface,
        private notifyEntryChange: NotifyEntryChangeUseCase.Interface
    ) {}

    async execute(input: Input): Promise<DeletedEntry> {
        const model = await getWritableModel(this.getModel, input.modelId);

        const latest = await this.getLatestRevision.execute(model, { id: input.entryId });
        if (latest.isFail()) {
            throw new Error(
                `Entry "${input.entryId}" not found in "${input.modelId}": ${latest.error.message}. Call queryEntries for valid entry IDs.`
            );
        }

        const entry = latest.value;
        const title = String(entry.values[model.titleFieldId] ?? entry.id);

        if (title !== input.title) {
            throw new Error(
                `Entry "${input.entryId}" is titled "${title}", not "${input.title}", so nothing was deleted. Check the entry with queryEntries.`
            );
        }

        const result = await this.moveEntryToBin.execute(model, entry.entryId);
        if (result.isFail()) {
            throw new Error(`Could not delete the entry: ${result.error.message}`);
        }

        await this.notifyEntryChange.execute({
            modelId: model.modelId,
            entryId: entry.entryId,
            change: "deleted"
        });

        return { entryId: entry.entryId, title };
    }
}

const DeleteEntryToolHandler = AiSdkToolHandler.createImplementation({
    implementation: DeleteEntryToolHandlerImpl,
    dependencies: [
        GetModelUseCase,
        GetLatestRevisionByEntryIdUseCase,
        MoveEntryToBinUseCase,
        NotifyEntryChangeUseCase
    ]
});

/** Moves one entry to the trash bin. Needs approval; it can be restored from the bin. */
class DeleteEntryToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "deleteEntry";
    readonly title = "Delete entry";
    readonly description =
        "Moves one content entry, with all its revisions, to the trash bin. It can be restored from the bin in the admin. Pass the entry's exact current title from queryEntries. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false, destructiveHint: true };
    readonly handler = DeleteEntryToolHandler;
}

export const DeleteEntryTool = AiSdkToolDefinition.createImplementation({
    implementation: DeleteEntryToolImpl,
    dependencies: []
});
