import { CmsModelField, CmsFieldValueTransformer, CmsContentEntry } from "~/types";
import { plugins } from "@webiny/plugins";

interface AvailableFieldTransformers {
    [fieldType: string]: CmsFieldValueTransformer;
}

/**
 * This method builds transformer plugins only once.
 * Really no need in building more than once because at this point all plugins are registered.
 */
let availableTransformerPlugins: AvailableFieldTransformers | undefined = undefined;
const getAvailableTransformerPlugins = (): AvailableFieldTransformers => {
    if (availableTransformerPlugins) {
        return availableTransformerPlugins;
    }
    availableTransformerPlugins = plugins
        .byType<CmsFieldValueTransformer>("cms-field-value-transformer")
        .reduce<AvailableFieldTransformers>((transformers, pl) => {
            const fieldTypes = Array.isArray(pl.fieldType) ? pl.fieldType : [pl.fieldType];
            for (const fieldType of fieldTypes) {
                if (transformers[fieldType]) {
                    console.warn(
                        `Transformer for field type "${fieldType}" is already defined. There cannot be more than one transformer.`
                    );
                    continue;
                }
                transformers[fieldType] = pl;
            }
            return transformers;
        }, {});

    return availableTransformerPlugins;
};

interface TransformationRunnerCallable {
    (field: CmsModelField, value: any): any;
}

let transformationRunner: TransformationRunnerCallable;
const createTransformationRunner = (): TransformationRunnerCallable => {
    if (transformationRunner) {
        return transformationRunner;
    }
    const availablePlugins = getAvailableTransformerPlugins();

    transformationRunner = (field, value) => {
        const transformer = availablePlugins[field.type];
        if (!transformer) {
            return value;
        }
        return transformer.transform(value, field);
    };
    return transformationRunner;
};

export const prepareFormData = (
    input: Partial<CmsContentEntry>,
    fields: CmsModelField[]
): CmsContentEntry => {
    const runTransformation = createTransformationRunner();

    return fields.reduce<CmsContentEntry>((output, field) => {
        const inputValue = input[field.fieldId];

        if (field.multipleValues) {
            const values = Array.isArray(inputValue) ? inputValue : undefined;
            if (!values) {
                return output;
            }
            output[field.fieldId] = values.map(value => runTransformation(field, value));
            return output;
        }
        /**
         * Regular values, single values.
         */
        output[field.fieldId] = runTransformation(field, inputValue);

        return output;
    }, {} as CmsContentEntry);
};
