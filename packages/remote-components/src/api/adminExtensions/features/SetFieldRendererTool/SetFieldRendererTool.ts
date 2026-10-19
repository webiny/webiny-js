import { z } from "zod";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { ADMIN_EXTENSION_TOOL_NAMES } from "~/shared/adminExtensions/constants.js";
import { SetModelFieldRendererUseCase } from "~/api/adminExtensions/features/SetModelFieldRenderer/abstractions.js";

const inputSchema = z.object({
    modelId: z.string().describe("The content model's id, e.g. 'article'."),
    fieldId: z.string().describe("A top-level field of that model, e.g. 'title'."),
    rendererName: z
        .string()
        .describe("The field renderer's name as given to createFieldRenderer, e.g. 'char-count'.")
});

type Input = z.infer<typeof inputSchema>;

class SetFieldRendererToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(private readonly setModelFieldRenderer: SetModelFieldRendererUseCase.Interface) {}

    async execute(input: Input): Promise<SetModelFieldRendererUseCase.Output & { note: string }> {
        const result = await this.setModelFieldRenderer.execute(input);
        if (result.isFail()) {
            throw new Error(`Could not apply the renderer: ${result.error.message}`);
        }
        return {
            ...result.value,
            note: "Applied. The next entry form opened for this model uses it; no reload needed."
        };
    }
}

const SetFieldRendererToolHandler = AiSdkToolHandler.createImplementation({
    implementation: SetFieldRendererToolHandlerImpl,
    dependencies: [SetModelFieldRendererUseCase]
});

/** Applies a generated field renderer to one field of a content model. Its own approval. */
class SetFieldRendererToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = ADMIN_EXTENSION_TOOL_NAMES.setFieldRenderer;
    readonly title = "Apply field renderer";
    readonly description =
        "Makes one field of a content model use a renderer created with createFieldRenderer. The renderer must be enabled and made for the field's type and for single or multiple values as the field is. Changes the model, so it needs user approval. Models defined in code cannot be changed this way.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };
    readonly handler = SetFieldRendererToolHandler;
}

export const SetFieldRendererTool = AiSdkToolDefinition.createImplementation({
    implementation: SetFieldRendererToolImpl,
    dependencies: []
});
