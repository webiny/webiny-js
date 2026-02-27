import zod from "zod";
import upperFirst from "lodash/upperFirst.js";
import camelCase from "lodash/camelCase.js";

const str = zod.string().trim();
const shortString = str.max(255);
const longString = str;
const optionalShortString = shortString.optional();
const optionalLongString = longString.optional();
const optionalNullishShortString = optionalShortString.nullish().default(null);
const optionalNullishLongString = optionalLongString.nullish().default(null);

const icon = zod
    .object({
        type: zod.string(),
        name: zod.string(),
        value: zod.string().optional()
    })
    .passthrough()
    .optional()
    .nullish()
    .default(null)
    .transform(value => {
        if (typeof value === "string") {
            return {
                type: "icon",
                name: value
            };
        }
        return value;
    });

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
            message: `Must not start with a number.`
        })
        .regex(/^(^[a-zA-Z0-9]+)$/, {
            message: `Must be alphanumeric string.`
        }),
    label: shortString,
    help: optionalNullishLongString,
    description: optionalNullishShortString,
    note: optionalNullishShortString,
    placeholder: optionalNullishShortString,
    type: shortString,
    tags: zod.array(shortString).optional().default([]),
    list: zod
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
        .nullish()
        .optional()
        .transform(value => {
            return value || undefined;
        }),
    renderer: zod
        .object({
            name: shortString,
            settings: zod.object({}).passthrough().nullish().optional()
        })
        .optional()
        .nullable()
        .default(null),
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
        .nullish()
        .optional()
        .default([])
        .transform(value => value || []),
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
        .nullish()
        .optional()
        .default([])
        .transform(value => value || []),
    settings: zod
        .object({})
        .passthrough()
        .optional()
        .nullish()
        .transform(value => {
            return value || {};
        })
        .default({}),
    permissions: zod
        .array(
            zod.object({
                target: shortString,
                accessLevel: zod.enum(["viewer", "no-access"])
            })
        )
        .optional()
        .nullish()
        .default([])
        .transform(value => value || [])
});

const apiNameRefinementValidation = (value: string): boolean => {
    if (value.match(/^[A-Z]/) === null) {
        return false;
    }
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

const modelIdTransformation = (value?: string) => {
    if (!value) {
        return value;
    }
    const camelCasedValue = camelCase(value);
    if (camelCasedValue.toLowerCase() === value.toLowerCase()) {
        return value;
    }
    return camelCasedValue;
};

export const createModelCreateValidation = () => {
    return zod.object({
        name: shortString,
        modelId: optionalShortString.transform(modelIdTransformation),
        singularApiName: shortString
            .min(1)
            .refine(apiNameRefinementValidation, refinementSingularValidationMessage),
        pluralApiName: shortString
            .min(1)
            .refine(apiNameRefinementValidation, refinementPluralValidationMessage),
        description: optionalNullishShortString.transform(value => {
            return value || "";
        }),
        group: shortString,
        icon,
        fields: zod.array(fieldSchema).default([]),
        layout: zod.array(zod.array(zod.any())).default([]),
        tags: zod.array(shortString).optional(),
        titleFieldId: optionalShortString.nullish(),
        descriptionFieldId: optionalShortString.nullish(),
        imageFieldId: optionalShortString.nullish(),
        defaultFields: zod.boolean().nullish()
    });
};

export const createModelUpdateValidation = () => {
    return zod.object({
        name: optionalShortString,
        singularApiName: optionalShortString.refine(value => {
            if (!value) {
                return true;
            }
            return apiNameRefinementValidation(value);
        }, refinementSingularValidationMessage),
        pluralApiName: optionalShortString.refine(value => {
            if (!value) {
                return true;
            }
            return apiNameRefinementValidation(value);
        }, refinementPluralValidationMessage),
        description: optionalNullishShortString,
        group: optionalShortString,
        icon,
        fields: zod.array(fieldSchema),
        layout: zod.array(zod.array(zod.any())),
        titleFieldId: optionalShortString.nullish(),
        descriptionFieldId: optionalShortString.nullish(),
        imageFieldId: optionalShortString.nullish(),
        tags: zod.array(shortString).optional()
    });
};

export const createModelCreateFromValidation = () => {
    return zod.object({
        name: shortString,
        modelId: optionalShortString.transform(modelIdTransformation),
        singularApiName: shortString.refine(
            apiNameRefinementValidation,
            refinementSingularValidationMessage
        ),
        pluralApiName: shortString.refine(
            apiNameRefinementValidation,
            refinementPluralValidationMessage
        ),
        description: optionalNullishShortString,
        group: shortString,
        icon
    });
};
