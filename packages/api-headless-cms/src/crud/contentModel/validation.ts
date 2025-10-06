import zod from "zod";
import upperFirst from "lodash/upperFirst.js";
import camelCase from "lodash/camelCase.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type {
    CmsModelSettingsWorkflowStep,
    CmsModelSettingsWorkflowStepTeam
} from "~/types/index.js";

const fieldSystemFields: string[] = [
    "id",
    "entryId",
    "createdOn",
    "modifiedOn",
    "publishedOn",
    "savedOn",
    "deletedOn",
    "restoredOn",
    "firstPublishedOn",
    "lastPublishedOn",
    "createdBy",
    "modifiedBy",
    "savedBy",
    "deletedBy",
    "restoredBy",
    "firstPublishedBy",
    "lastPublishedBy",
    "revisionCreatedOn",
    "revisionModifiedOn",
    "revisionSavedOn",
    "revisionDeletedOn",
    "revisionRestoredOn",
    "revisionFirstPublishedOn",
    "revisionLastPublishedOn",
    "revisionCreatedBy",
    "revisionModifiedBy",
    "revisionSavedBy",
    "revisionDeletedBy",
    "revisionRestoredBy",
    "revisionFirstPublishedBy",
    "revisionLastPublishedBy",
    "meta",
    "wbyAco_location"
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
                    message: `Field ID "${value}" is a reserved keyword, and is not allowed.`
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
        .default({})
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

const refinementModelIdValidation = (value?: string) => {
    if (!value) {
        return true;
    } else if (value.match(/^[a-zA-Z]/) === null) {
        return false;
    }
    const camelCasedValue = camelCase(value).toLowerCase();
    return camelCasedValue === value.toLowerCase();
};
const refinementModelIdValidationMessage = (value?: string) => {
    if (!value) {
        return {};
    } else if (value.match(/^[a-zA-Z]/) === null) {
        return {
            message: `The modelId "${value}" is not valid. It must start with a A-Z or a-z.`
        };
    }
    return {
        message: `The modelId "${value}" is not valid.`
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

const modelSettingsWorkflowStepValidation = zod.object({
    id: zod.string(),
    title: zod.string(),
    color: zod.string(),
    description: zod
        .string()
        .nullish()
        .optional()
        .transform(value => {
            return value || undefined;
        }),
    teams: zod
        .array(
            zod.object({
                id: zod.string()
            })
        )
        .min(1, "You must select at least one team.")
        .transform(value => {
            return value as NonEmptyArray<CmsModelSettingsWorkflowStepTeam>;
        }),
    notifications: zod
        .array(
            zod.object({
                id: zod.string()
            })
        )
        .optional()
});

const modelSettingsWorkflowValidation = zod.object({
    id: zod.string(),
    name: zod.string(),
    steps: zod
        .array(modelSettingsWorkflowStepValidation)
        .min(1, "You must add at least one step.")
        .transform(value => {
            return value as NonEmptyArray<CmsModelSettingsWorkflowStep>;
        })
});

const modelSettingsValidation = zod
    .object({
        workflows: zod
            .array(modelSettingsWorkflowValidation)
            .optional()
            .superRefine((workflows, ctx) => {
                if (!workflows?.length) {
                    return;
                }
                const seen = new Set<string>();
                for (let current = 0; current < workflows.length; current++) {
                    const workflow = workflows[current];
                    if (seen.has(workflow.id)) {
                        ctx.addIssue({
                            code: zod.ZodIssueCode.custom,
                            message: `Duplicate workflow id "${workflow.id}"`,
                            path: [current, "id"]
                        });
                    }
                    seen.add(workflow.id);
                }
            })
    })
    .passthrough()
    .nullish()
    .optional()
    .transform(value => {
        return value || undefined;
    });

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
        icon: optionalNullishShortString,
        fields: zod.array(fieldSchema).default([]),
        layout: zod.array(zod.array(shortString)).default([]),
        tags: zod.array(shortString).optional(),
        titleFieldId: optionalShortString.nullish(),
        descriptionFieldId: optionalShortString.nullish(),
        imageFieldId: optionalShortString.nullish(),
        defaultFields: zod.boolean().nullish(),
        settings: modelSettingsValidation
    });
};

export const createModelImportValidation = () => {
    return zod.object({
        name: shortString.min(1).refine(
            value => {
                return value.match(/[a-zA-Z]/) !== null;
            },
            value => {
                return {
                    message: `The name "${value}" is not valid.`
                };
            }
        ),
        modelId: shortString
            .min(1)
            .refine(refinementModelIdValidation, refinementModelIdValidationMessage)
            .transform(modelIdTransformation),
        singularApiName: shortString
            .min(1)
            .refine(apiNameRefinementValidation, refinementSingularValidationMessage),
        pluralApiName: shortString
            .min(1)
            .refine(apiNameRefinementValidation, refinementPluralValidationMessage),
        description: optionalNullishShortString,
        group: shortString,
        icon: optionalNullishShortString,
        fields: zod.array(fieldSchema).min(1),
        layout: zod.array(zod.array(shortString)).min(1),
        tags: zod.array(shortString).optional(),
        titleFieldId: shortString.nullish(),
        descriptionFieldId: optionalShortString.nullish(),
        imageFieldId: optionalShortString.nullish(),
        settings: modelSettingsValidation
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
        icon: optionalNullishShortString,
        locale: optionalShortString,
        settings: modelSettingsValidation
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
        icon: optionalNullishShortString,
        fields: zod.array(fieldSchema),
        layout: zod.array(zod.array(shortString)),
        titleFieldId: optionalShortString.nullish(),
        descriptionFieldId: optionalShortString.nullish(),
        imageFieldId: optionalShortString.nullish(),
        tags: zod.array(shortString).optional(),
        settings: modelSettingsValidation
    });
};
