import zod from "zod";

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
    multipleValues: zod.boolean().optional().default(false),
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
                settings: zod.object({}).passthrough().optional().default({})
            })
        )
        .optional()
        .default([]),
    listValidation: zod
        .array(
            zod.object({
                name: shortString,
                message: shortString,
                settings: zod.object({}).passthrough().optional().default({})
            })
        )
        .optional()
        .default([]),
    settings: zod.object({}).passthrough().optional().default({})
});

export const createModelCreateValidation = () => {
    return zod.object({
        name: shortString,
        modelId: optionalShortString,
        description: optionalNullishShortString,
        group: shortString,
        fields: zod.array(fieldSchema).default([]),
        layout: zod.array(zod.array(shortString)).default([]),
        tags: zod.array(shortString).optional(),
        titleFieldId: optionalShortString,
        descriptionFieldId: optionalShortString
    });
};

export const createModelCreateFromValidation = () => {
    return zod.object({
        name: shortString,
        modelId: optionalShortString,
        description: optionalNullishShortString,
        group: shortString,
        locale: optionalShortString
    });
};

export const createModelUpdateValidation = () => {
    return zod.object({
        name: optionalShortString,
        description: optionalNullishShortString,
        group: optionalShortString,
        fields: zod.array(fieldSchema),
        layout: zod.array(zod.array(shortString)),
        titleFieldId: optionalShortString,
        tags: zod.array(shortString).optional()
    });
};
