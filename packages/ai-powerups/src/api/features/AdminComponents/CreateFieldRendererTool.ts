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
    description: z
        .string()
        .describe("One line on what this renderer does, shown to whoever reviews it later."),
    source: z.string().describe(`The renderer's TSX source. ${RENDERER_CONTRACT}`)
});

type Input = z.infer<typeof inputSchema>;

class CreateFieldRendererToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(private repository: AdminComponentsRepository.Interface) {}

    async execute(input: Input) {
        const component = await this.repository.create({
            kind: "fieldRenderer",
            name: input.name,
            description: input.description,
            source: input.source
        });

        return {
            id: component.id,
            name: component.name,
            /*
             * The source is not transpiled here, so "created" is not "works". The admin bundles it on
             * next load and shows the failure inline if it does not compile. Say so, rather than
             * letting the assistant report a successful write as a working renderer.
             */
            note: `Saved. It is applied to fields using renderer "${component.name}" the next time the admin loads. If it fails to compile, the error appears where the field is rendered.`
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
        "Creates a custom field renderer for the admin, from TSX source you write. Use this when someone asks to change how a field looks or behaves in the admin, e.g. 'make the menu field a drag-and-drop builder'. The source runs in the browser with no imports available — read the source parameter's description before writing it. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };
    readonly handler = CreateFieldRendererToolHandler;
}

export const CreateFieldRendererTool = AiSdkToolDefinition.createImplementation({
    implementation: CreateFieldRendererToolImpl,
    dependencies: []
});
