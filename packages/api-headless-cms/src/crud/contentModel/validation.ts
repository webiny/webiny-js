import zod from "zod";
import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";

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
                message: optionalShortString.default("Value is required."),
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
                message: optionalShortString.default("Value is required."),
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

const refinementValidation = (value: string): boolean => {
    return value === upperFirst(camelCase(value));
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

export const createModelCreateValidation = () => {
    return zod.object({
        name: shortString,
        modelId: optionalShortString,
        singularApiName: shortString.refine(
            refinementValidation,
            refinementSingularValidationMessage
        ),
        pluralApiName: shortString.refine(refinementValidation, refinementPluralValidationMessage),
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
};

export const createModelCreateFromValidation = () => {
    return zod.object({
        name: shortString,
        modelId: optionalShortString,
        singularApiName: shortString.refine(
            refinementValidation,
            refinementSingularValidationMessage
        ),
        pluralApiName: shortString.refine(refinementValidation, refinementPluralValidationMessage),
        description: optionalNullishShortString,
        group: shortString,
        icon: optionalNullishShortString,
        locale: optionalShortString
    });
};

export const createModelUpdateValidation = () => {
    return zod.object({
        name: optionalShortString,
        singularApiName: optionalShortString.refine(value => {
            if (!value) {
                return true;
            }
            return refinementValidation(value);
        }, refinementSingularValidationMessage),
        pluralApiName: optionalShortString.refine(value => {
            if (!value) {
                return true;
            }
            return refinementValidation(value);
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
    });
};
