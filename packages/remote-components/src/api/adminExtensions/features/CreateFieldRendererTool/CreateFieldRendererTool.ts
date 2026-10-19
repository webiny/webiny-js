import { z } from "zod";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { CreateAdminExtensionUseCase } from "~/api/adminExtensions/features/CreateAdminExtension/abstractions.js";
import { describeFieldRendererContract } from "~/api/adminExtensions/kinds/fieldRenderer/describeFieldRendererContract.js";
import { FIELD_RENDERER_FIELD_TYPES } from "~/shared/adminExtensions/fieldRendererRuntime.js";
import { toCmsRendererName } from "~/shared/adminExtensions/fieldRendererRuntime.js";
import type { FieldRendererConfig } from "~/shared/adminExtensions/fieldRendererConfig.js";

const inputSchema = z.object({
    name: z
        .string()
        .describe(
            "Identifier, e.g. 'char-count'. Lowercase letters, digits and dashes, starting with a letter."
        ),
    label: z.string().describe("Name shown in the field editor's Appearance tab."),
    description: z.string().describe("One sentence on what the renderer shows."),
    fieldType: z.enum(FIELD_RENDERER_FIELD_TYPES).describe("The CMS field type it renders."),
    multipleValues: z
        .boolean()
        .describe("True for a list field (multiple values), false for a single value."),
    source: z.string().describe("The renderer's TSX source, following the rules above.")
});

type Input = z.infer<typeof inputSchema>;

interface CreatedFieldRenderer {
    id: string;
    name: string;
    cmsRendererName: string;
    note: string;
}

class CreateFieldRendererToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(private readonly createAdminExtension: CreateAdminExtensionUseCase.Interface) {}

    async execute(input: Input): Promise<CreatedFieldRenderer> {
        const config: FieldRendererConfig = {
            fieldType: input.fieldType,
            multipleValues: input.multipleValues
        };

        const result = await this.createAdminExtension.execute({
            kind: "fieldRenderer",
            name: input.name,
            label: input.label,
            description: input.description,
            source: input.source,
            config: JSON.stringify(config)
        });

        if (result.isFail()) {
            throw new Error(`Could not create the field renderer: ${result.error.message}`);
        }

        return {
            id: result.value.id,
            name: result.value.name,
            cmsRendererName: toCmsRendererName(result.value.name),
            note: "Compiled and saved. It is offered in the field editor's Appearance tab once the admin reloads. Use setFieldRenderer to apply it to a field."
        };
    }
}

const CreateFieldRendererToolHandler = AiSdkToolHandler.createImplementation({
    implementation: CreateFieldRendererToolHandlerImpl,
    dependencies: [CreateAdminExtensionUseCase]
});

/**
 * Writes a custom CMS field renderer. The source is compiled before it is saved, so code that does
 * not compile comes back as an error the assistant can fix, before anyone approves it.
 *
 * This only adds the renderer to the catalogue. Applying it to a field is `setFieldRenderer`, a
 * second approval, so accepting the code never also changes a model.
 */
class CreateFieldRendererToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "createFieldRenderer";
    readonly title = "Create field renderer";
    readonly description = [
        "Writes a custom renderer for a CMS field type: how a field looks and behaves in the entry form. It runs in the admin for everyone who opens that form. Requires user approval. It does not apply the renderer to any field; call setFieldRenderer for that, after this succeeds.",
        describeFieldRendererContract()
    ].join("\n\n");
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };
    readonly handler = CreateFieldRendererToolHandler;
}

export const CreateFieldRendererTool = AiSdkToolDefinition.createImplementation({
    implementation: CreateFieldRendererToolImpl,
    dependencies: []
});
