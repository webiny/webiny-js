import { z } from "zod";
import { AiSdkToolDefinition, AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { AdminComponentsRepository } from "./abstractions.js";
import { RENDERER_CONTRACT } from "./rendererContract.js";

const inputSchema = z.object({
    name: z
        .string()
        .describe(
            "The renderer name a field will ask for, e.g. 'menuBuilder'. camelCase, no spaces."
        ),
    label: z
        .string()
        .describe(
            "Short title for the renderer list, in the style of the built-in ones: 'Text Input', 'Hidden Field'. Two or three words, no trailing full stop."
        ),
    description: z
        .string()
        .describe(
            "One sentence under the label, saying what it does. Written for whoever is choosing between renderers, so say how it differs from the default rather than repeating the label."
        ),
    fieldType: z
        .string()
        .describe(
            "The CMS field type this renderer is for, e.g. 'text', 'long-text', 'number', 'boolean', 'datetime', 'object', 'file', 'ref', 'json'. Only fields of this type will offer it. Use describeContentModel to confirm the type of the field you are targeting rather than assuming it."
        ),
    appliesTo: z
        .enum(["single", "list", "both"])
        .describe(
            "Whether this renderer handles a single value, a list of values, or either. A renderer that reads field.items is 'list'; one that reads field.value is 'single'. Getting this wrong offers the renderer on fields whose value shape it cannot read."
        ),
    source: z.string().describe(`The renderer's TSX source. ${RENDERER_CONTRACT}`)
});

type Input = z.infer<typeof inputSchema>;

class CreateFieldRendererToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(private repository: AdminComponentsRepository.Interface) {}

    async execute(input: Input) {
        const component = await this.repository.create({
            kind: "fieldRenderer",
            name: input.name,
            label: input.label,
            description: input.description,
            fieldType: input.fieldType,
            appliesTo: input.appliesTo,
            source: input.source
        });

        return {
            id: component.id,
            name: component.name,
            /*
             * The source is not transpiled here, so "created" is not "works". The admin bundles it on
             * next load and shows the failure inline if it does not compile. Say so, rather than
             * letting the assistant report a successful write as a working renderer.
             *
             * The second sentence is the one users need: saving a renderer does not apply it. It has
             * to be picked, per field, in the model editor.
             */
            note: `Saved. Reload the admin, then pick "${component.label}" under Appearance on any ${component.fieldType} field to use it. It is offered only on ${component.fieldType} fields. If the source fails to compile, the error appears in place of the field.`
        };
    }
}

const CreateFieldRendererToolHandler = AiSdkToolHandler.createImplementation({
    implementation: CreateFieldRendererToolHandlerImpl,
    dependencies: [AdminComponentsRepository]
});

/**
 * Writes a field renderer that the admin then runs.
 *
 * Needs approval, and for a stronger reason than the other write tools. This one stores code that
 * later executes in an admin user's browser with the admin's own React and design system handed to
 * it. The approval step is where a human reads the source before that happens, so the arguments the
 * assistant proposes ARE the review.
 */
class CreateFieldRendererToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "createFieldRenderer";
    readonly title = "Create field renderer";
    readonly description =
        "Creates a custom field renderer for the admin, from TSX source you write. Use this when someone asks to change how a field looks or behaves in the admin, e.g. 'make the menu field a drag-and-drop builder'. The source runs in the browser with no imports available, so read the source parameter's description before writing it. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };
    readonly handler = CreateFieldRendererToolHandler;
}

export const CreateFieldRendererTool = AiSdkToolDefinition.createImplementation({
    implementation: CreateFieldRendererToolImpl,
    dependencies: []
});
