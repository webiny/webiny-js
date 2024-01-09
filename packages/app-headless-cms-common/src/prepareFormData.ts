import { CmsFieldValueTransformer, CmsModelField } from "~/types";
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

export const prepareFormData = <T extends Record<string, any>>(
    input: T,
    fields: CmsModelField[]
): T => {
    const runTransformation = createTransformationRunner();

    return fields.reduce<Record<keyof T, any>>((output, field) => {
        const inputValue = input[field.fieldId];

        const fieldId: keyof T = field.fieldId;

        if (field.multipleValues) {
            const values = Array.isArray(inputValue) ? inputValue : undefined;
            if (!values) {
                return output;
            }
            /**
             * We need to skip sending the values if there is only one item in the array, and it is a null or undefined value.
             *
             * In case there are more items in the array, and they are null / undefined,
             * we must not do anything because it means the user added new items into the array,
             * and they want to have it like that - or is a mistake by user - in that case they will then remove the extra item(s).
             */
            //
            else if (values.length === 1 && (values[0] === null || values[0] === undefined)) {
                return output;
            }

            output[fieldId] = values.map(value => runTransformation(field, value));

            return output;
        }
        /**
         * Regular values, single values.
         */
        output[fieldId] = runTransformation(field, inputValue);

        return output;
    }, {} as T);
};
