import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import type { CmsModelField } from "~/types/index.js";

const inputSchema = z.object({
    modelId: z
        .string()
        .describe("Model ID as returned by listContentModels (e.g. 'product', not 'Products').")
});

type Input = z.infer<typeof inputSchema>;

interface FieldDescription {
    fieldId: string;
    type: string;
    label: string;
    /** True when the field holds an array of values — affects which `where` operators apply. */
    list: boolean;
    required: boolean;
    description?: string;
    /** Allowed values for enum-like fields, so a filter can be built without guessing. */
    predefinedValues?: string[];
    /** For `ref` fields: which models this field can point at. */
    refModels?: string[];
    /** For `object` fields: the nested field set. */
    fields?: FieldDescription[];
}

interface ModelDescription {
    modelId: string;
    name: string;
    description: string | null;
    singularApiName: string;
    pluralApiName: string;
    titleFieldId: string;
    fields: FieldDescription[];
}

const isRequired = (field: CmsModelField): boolean =>
    field.validation.some(validator => validator.name === "required");

const describeField = (field: CmsModelField): FieldDescription => {
    const described: FieldDescription = {
        fieldId: field.fieldId,
        type: field.type,
        label: field.label,
        list: Boolean(field.list),
        required: isRequired(field)
    };

    if (field.description) {
        described.description = field.description;
    }

    const values = field.predefinedValues;
    if (values?.enabled && values.values?.length) {
        described.predefinedValues = values.values.map(entry => entry.value);
    }

    const refModels = field.settings?.models;
    if (refModels?.length) {
        described.refModels = refModels.map(model => model.modelId);
    }

    const nested = field.settings?.fields;
    if (nested?.length) {
        described.fields = nested.map(describeField);
    }

    return described;
};

/**
 * Supplies the field detail needed to build a valid `queryEntries` filter. Deliberately a separate
 * call from `listContentModels`: returning full field sets for every model would be large and mostly
 * unread, so the model pays for detail only on the model it actually cares about.
 */
class DescribeContentModelToolImpl implements IAiSdkTool<Input> {
    readonly name = "describeContentModel";
    readonly title = "Describe content model";
    readonly description =
        "Returns the fields of one content model — field IDs, types, whether each is a list, required flags, allowed values, and referenced models. Call this before queryEntries so filters use real field IDs.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: true, idempotentHint: true };

    constructor(private getModel: GetModelUseCase.Interface) {}

    async execute(input: Input): Promise<ModelDescription> {
        const result = await this.getModel.execute(input.modelId);

        if (result.isFail()) {
            throw new Error(
                `Could not describe model "${input.modelId}": ${result.error.message}. Call listContentModels for valid model IDs.`
            );
        }

        const model = result.value;

        return {
            modelId: model.modelId,
            name: model.name,
            description: model.description,
            singularApiName: model.singularApiName,
            pluralApiName: model.pluralApiName,
            titleFieldId: model.titleFieldId,
            fields: model.fields.map(describeField)
        };
    }
}

export const DescribeContentModelTool = AiSdkTool.createImplementation({
    implementation: DescribeContentModelToolImpl,
    dependencies: [GetModelUseCase]
});
