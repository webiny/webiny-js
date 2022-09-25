import { CmsEditorField, CmsFieldValueTransformer } from "~/types";
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
    (field: CmsEditorField, value: any): any;
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
    input: Record<string, any>,
    fields: CmsEditorField[]
): Record<string, any> => {
    const runTransformation = createTransformationRunner();

    return fields.reduce<Record<string, any>>((output, field) => {
        // if (input.hasOwnProperty(field.fieldId) === false) {
        //     return output;
        // }
        const inputValue = input[field.fieldId];
        const childFields = field.type === "object" ? field.settings?.fields : undefined;
        /**
         * There is a possibility that we have an object field - it has child fields.
         */
        if (childFields) {
            /**
             * Field can be repeatable, and in that case, we must go through all values and transform them.
             */
            if (field.multipleValues) {
                const values = Array.isArray(inputValue) ? inputValue : undefined;
                if (!values) {
                    return output;
                }
                output[field.fieldId] = values.map(value => {
                    return prepareFormData(value, childFields);
                });
                return output;
            }
            /**
             * Or if is not repeatable, just go through the fields without the need to go through an array.
             */
            output[field.fieldId] = prepareFormData(inputValue, childFields);

            return output;
        }
        /**
         * Regular fields, multiple values enabled.
         */
        //
        else if (field.multipleValues) {
            const values = Array.isArray(inputValue) ? inputValue : undefined;
            if (!values) {
                return output;
            }
            output[field.fieldId] = values
                /**
                 * Transformations need to run on all the available fields.
                 */
                .map(value => {
                    return runTransformation(field, value);
                });
            return output;
        }
        /**
         * Regular values, single values.
         */
        output[field.fieldId] = runTransformation(field, inputValue);

        return output;
    }, {});
};
