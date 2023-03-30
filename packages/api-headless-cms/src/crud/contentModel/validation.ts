import zod from "zod";
import { createTypeName } from "~/utils/createTypeName";

const fieldSystemFields: string[] = [
    "id",
    "fieldId",
    "storageId",
    "label",
    "helpText",
    "placeholderText",
    "type",
    "multipleValues",
    "predefinedValues",
    "renderer",
    "validation",
    "listValidation",
    "settings"
];

const str = zod.string().trim();
const shortString = str.max(255);
const optionalShortString = shortString.optional();
const optionalNullishShortString = optionalShortString.nullish();

const fieldSchema = zod.object({
    id: shortString,
    storageId: zod
        .string()
        .optional()
        .transform(() => {
            return "";
        }),
    fieldId: shortString
        .max(100)
        .regex(/^!?[a-zA-Z]/, {
            message: `Provided value is not valid - must not start with a number.`
        })
        .regex(/^(^[a-zA-Z0-9]+)$/, {
            message: `Provided value is not valid - must be alphanumeric string.`
        })
        .superRefine((value, ctx) => {
            if (fieldSystemFields.includes(value)) {
                return ctx.addIssue({
                    code: zod.ZodIssueCode.custom,
                    message: `Provided ${value} is not valid - "${value}" is an auto-generated field.`,
                    path: ["fieldId"]
                });
            }
        }),
    label: shortString,
    helpText: optionalShortString.optional().nullish().default(null),
    placeholderText: optionalShortString.optional().nullable().default(null),
    type: shortString,
    tags: zod.array(shortString).optional().default([]),
    multipleValues: zod
        .boolean()
        .optional()
        .nullish()
        .transform(value => {
            return !!value;
        })
        .default(false),
    predefinedValues: zod
        .object({
            enabled: zod.boolean(),
            values: zod
                .array(
                    zod.object({
                        value: shortString,
                        label: shortString,
                        selected: zod.boolean().optional().default(false)
                    })
                )
                .default([])
        })
        .default({
            enabled: false,
            values: []
        })
        .optional(),
    renderer: zod
        .object({
            name: shortString
        })
        .optional(),
    validation: zod
        .array(
            zod.object({
                name: shortString,
                message: shortString,
                settings: zod
                    .object({})
                    .passthrough()
                    .optional()
                    .nullish()
                    .transform(value => {
                        return value || {};
                    })
                    .default({})
            })
        )
        .optional()
        .default([]),
    listValidation: zod
        .array(
            zod.object({
                name: shortString,
                message: shortString,
                settings: zod
                    .object({})
                    .passthrough()
                    .optional()
                    .nullish()
                    .transform(value => {
                        return value || {};
                    })
                    .default({})
            })
        )
        .optional()
        .default([]),
    settings: zod
        .object({})
        .passthrough()
        .optional()
        .nullish()
        .transform(value => {
            return value || {};
        })
        .default({})
});

const refinementApiNameValidation = (value: string): boolean => {
    return value === createTypeName(value);
};
const refinementSingularValidationMessage = (value?: string) => {
    return {
        message: `The Singular API Name value "${
            value || "undefined"
        }" is not valid. It must in Upper First + Camel Cased form. For example: "ArticleCategory" or "CarMake".`
    };
};
const refinementPluralValidationMessage = (value?: string) => {
    return {
        message: `The Plural API Name value "${
            value || "undefined"
        }" is not valid. It must in Upper First + Camel Cased form. For example: "ArticleCategories" or "CarMakes".`
    };
};

type RefinementApiNameComparison = Partial<
    Pick<zod.infer<typeof modelCreateValidation>, "singularApiName" | "pluralApiName">
>;
const refinementApiNameComparisonValidation = (obj: RefinementApiNameComparison) => {
    /**
     * No need to validate if either of the values are not provided.
     */
    if (!obj.singularApiName || !obj.pluralApiName) {
        return true;
    }
    return obj.singularApiName !== obj.pluralApiName;
};

const refinementApiNameComparisonMessage = (obj: RefinementApiNameComparison) => {
    return {
        message: `Singular and plural API name values cannot be the same: ${obj.singularApiName} - ${obj.pluralApiName}.`,
        path: ["singularApiName"]
    };
};

const modelCreateValidation = zod.object({
    name: shortString,
    modelId: optionalShortString,
    singularApiName: shortString.refine(
        refinementApiNameValidation,
        refinementSingularValidationMessage
    ),
    pluralApiName: shortString.refine(
        refinementApiNameValidation,
        refinementPluralValidationMessage
    ),
    description: optionalNullishShortString,
    group: shortString,
    icon: optionalNullishShortString,
    fields: zod.array(fieldSchema).default([]),
    layout: zod.array(zod.array(shortString)).default([]),
    tags: zod.array(shortString).optional(),
    titleFieldId: optionalShortString.nullish(),
    descriptionFieldId: optionalShortString.nullish(),
    imageFieldId: optionalShortString.nullish(),
    defaultFields: zod.boolean().nullish()
});

export const createModelCreateValidation = () => {
    return modelCreateValidation.refine(
        refinementApiNameComparisonValidation,
        refinementApiNameComparisonMessage
    );
};

export const createModelCreateFromValidation = () => {
    return zod
        .object({
            name: shortString,
            modelId: optionalShortString,
            singularApiName: shortString.refine(
                refinementApiNameValidation,
                refinementSingularValidationMessage
            ),
            pluralApiName: shortString.refine(
                refinementApiNameValidation,
                refinementPluralValidationMessage
            ),
            description: optionalNullishShortString,
            group: shortString,
            icon: optionalNullishShortString,
            locale: optionalShortString
        })
        .refine(refinementApiNameComparisonValidation, refinementApiNameComparisonMessage);
};

export const createModelUpdateValidation = () => {
    return zod
        .object({
            name: optionalShortString,
            singularApiName: optionalShortString.refine(value => {
                if (!value) {
                    return true;
                }
                return refinementApiNameValidation(value);
            }, refinementSingularValidationMessage),
            pluralApiName: optionalShortString.refine(value => {
                if (!value) {
                    return true;
                }
                return refinementApiNameValidation(value);
            }, refinementPluralValidationMessage),
            description: optionalNullishShortString,
            group: optionalShortString,
            icon: optionalNullishShortString,
            fields: zod.array(fieldSchema),
            layout: zod.array(zod.array(shortString)),
            titleFieldId: optionalShortString.nullish(),
            descriptionFieldId: optionalShortString.nullish(),
            imageFieldId: optionalShortString.nullish(),
            tags: zod.array(shortString).optional()
        })
        .refine(refinementApiNameComparisonValidation, refinementApiNameComparisonMessage);
};
