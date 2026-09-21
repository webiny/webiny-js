import { z } from "zod";
import { AiSdkToolDefinition, AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { UpdateModelUseCase } from "@webiny/api-headless-cms/features/contentModel/UpdateModel/index.js";
import { AdminComponentsRepository } from "./abstractions.js";

const inputSchema = z.object({
    modelId: z
        .string()
        .describe(
            "The content model's id, e.g. 'article'. This is the modelId, not the display name. Use listContentModels to find it rather than guessing from what the user called it."
        ),
    fieldId: z
        .string()
        .describe(
            "The field's fieldId, e.g. 'title'. Use describeContentModel to confirm it; the label a user sees is often not the fieldId."
        ),
    rendererName: z
        .string()
        .describe(
            "The renderer to apply, e.g. 'menuBuilder'. This is the renderer's name, not its label. Pass the name you gave createFieldRenderer."
        )
});

type Input = z.infer<typeof inputSchema>;

/*
 * A renderer has to match the field it is put on. The stored metadata says which field type it was
 * written for and whether it reads a single value or a list, and a renderer reading `field.items` on
 * a single-value field renders nothing at all rather than failing, so this is checked here where it
 * can still be reported.
 */
const checkCompatibility = (
    renderer: { fieldType: string; appliesTo: string },
    field: { type: string; list?: boolean }
): string | null => {
    if (renderer.fieldType && renderer.fieldType !== field.type) {
        return `it was written for "${renderer.fieldType}" fields and this field is "${field.type}"`;
    }

    const isList = Boolean(field.list);

    if (renderer.appliesTo === "list" && !isList) {
        return "it expects a list field and this field holds a single value";
    }

    if (renderer.appliesTo === "single" && isList) {
        return "it expects a single value and this field is a list";
    }

    return null;
};

class SetFieldRendererToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private updateModel: UpdateModelUseCase.Interface,
        private repository: AdminComponentsRepository.Interface
    ) {}

    async execute(input: Input) {
        const modelResult = await this.getModel.execute(input.modelId);
        if (modelResult.isFail()) {
            throw new Error(
                `Could not read model "${input.modelId}": ${modelResult.error.message}. Use listContentModels to check the id.`
            );
        }

        const model = modelResult.value;
        const field = model.fields.find(f => f.fieldId === input.fieldId);

        if (!field) {
            const available = model.fields.map(f => f.fieldId).join(", ");
            throw new Error(
                `Model "${input.modelId}" has no field "${input.fieldId}". Its fields are: ${available}.`
            );
        }

        /*
         * Only generated renderers can be checked. A built-in name is a legitimate value here (it is
         * how you put a field back to its default) but the API has no list of them, since they are
         * registered in the browser.
         */
        const generated = await this.repository.listEnabled("fieldRenderer");
        const renderer = generated.find(r => r.name === input.rendererName);

        if (renderer) {
            const mismatch = checkCompatibility(renderer, field);
            if (mismatch) {
                throw new Error(
                    `Renderer "${input.rendererName}" cannot be used on "${input.fieldId}": ${mismatch}. Either pick a different field or create a renderer for this one.`
                );
            }
        }

        /*
         * `fields` and `layout` are required on update, so the whole set goes back with one field
         * changed. Everything else about the model is left out and preserved.
         */
        const fields = model.fields.map(f =>
            f.fieldId === input.fieldId
                ? { ...f, renderer: { ...f.renderer, name: input.rendererName } }
                : f
        );

        const result = await this.updateModel.execute(input.modelId, {
            fields,
            layout: model.layout
        });

        if (result.isFail()) {
            /*
             * A model defined in code cannot be changed through the API at all. Worth naming, because
             * the user's next question is always why, and the answer is not something they can fix
             * from the admin.
             */
            if (result.error.code === "Cms/Model/CannotUpdateCodeModel") {
                throw new Error(
                    `Model "${input.modelId}" is defined in code, so its fields cannot be changed from here. The renderer was created and can be used on a model built in the admin.`
                );
            }

            throw new Error(`Could not update model "${input.modelId}": ${result.error.message}`);
        }

        return {
            modelId: input.modelId,
            fieldId: input.fieldId,
            rendererName: input.rendererName,
            /*
             * The admin loads generated renderers once, on boot. A renderer created earlier in this
             * same conversation is therefore not in the running page yet, so say that plainly rather
             * than letting the user conclude it did not work.
             */
            note: renderer
                ? `Applied. Reload the admin to see it: generated renderers are loaded when the admin starts, so one created in this conversation is not in the current page yet.`
                : `Applied. "${input.rendererName}" is not one of the generated renderers, so it was not checked against this field; if it is not a built-in renderer name either, the field will quietly fall back to its default.`
        };
    }
}

const SetFieldRendererToolHandler = AiSdkToolHandler.createImplementation({
    implementation: SetFieldRendererToolHandlerImpl,
    dependencies: [GetModelUseCase, UpdateModelUseCase, AdminComponentsRepository]
});

/**
 * Puts a renderer on a field.
 *
 * Separate from `createFieldRenderer` on purpose. Writing code and changing a content model are two
 * different decisions, and the approval screen should show them as two, so someone can accept the
 * renderer and still refuse to have it applied to a particular field. It also lets an existing
 * renderer be reused on another field without generating anything.
 */
class SetFieldRendererToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "setFieldRenderer";
    readonly title = "Apply field renderer";
    readonly description =
        "Sets which renderer a content model field uses, which is what actually applies a renderer to a field. Creating a renderer does not put it anywhere. Use this after createFieldRenderer when the user named a model and field, or on its own to reuse an existing renderer. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };
    readonly handler = SetFieldRendererToolHandler;
}

export const SetFieldRendererTool = AiSdkToolDefinition.createImplementation({
    implementation: SetFieldRendererToolImpl,
    dependencies: []
});
