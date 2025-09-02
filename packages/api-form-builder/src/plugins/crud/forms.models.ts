import zod from "zod";

export const FormFieldsModel = zod.object({
    _id: zod.string(),
    type: zod.string(),
    name: zod.string(),
    fieldId: zod.string(),
    label: zod.string(),
    helpText: zod.string().optional().nullish().default(""),
    placeholderText: zod.string().optional().nullish().default(""),
    options: zod
        .array(
            zod.object({
                label: zod.string().optional().default(""),
                value: zod.string().optional().default("")
            })
        )
        .optional()
        .default([]),
    validation: zod
        .array(
            zod.object({
                name: zod.string(),
                message: zod.string().optional().default(""),
                settings: zod.object({}).passthrough().optional().default({})
            })
        )
        .optional()
        .default([]),
    settings: zod.object({}).optional().default({})
});

export const FormStepsModel = zod.object({
    title: zod.string(),
    layout: zod.array(zod.array(zod.string())).optional().default([])
});

export const FormSettingsModel = zod.object({
    layout: zod
        .object({
            renderer: zod.string().optional().default("default")
        })
        .optional()
        .default({
            renderer: "default"
        }),
    submitButtonLabel: zod.string().optional().default("").nullable(),
    fullWidthSubmitButton: zod.boolean().optional().default(false).nullable(),
    successMessage: zod.array(zod.object({}).passthrough()).optional().nullable().default(null),
    termsOfServiceMessage: zod
        .object({
            message: zod.array(zod.object({}).passthrough()).optional().nullable().default(null),
            errorMessage: zod.string().optional().default("").nullable(),
            enabled: zod.boolean().optional().nullish().default(null)
        })
        .nullable()
        .default(null),
    reCaptcha: zod
        .object({
            enabled: zod.boolean().optional().nullish().default(null),
            /**
             * Note: We've replaced "i18nString()" with "string()"
             */
            errorMessage: zod
                .string()
                .optional()
                .default("Please verify that you are not a robot."),
            secretKey: zod.string().optional().nullish().default("").nullable(),
            siteKey: zod.string().optional().nullish().default("").nullable()
        })
        .loose()
        .optional()
});

export const FormCreateDataModel = zod.object({
    name: zod.string()
});

export const FormUpdateDataModel = zod.object({
    name: zod.string().optional(),
    fields: zod.array(FormFieldsModel).optional(),
    steps: zod.array(FormStepsModel).optional(),
    settings: FormSettingsModel.optional(),
    triggers: zod.object({}).passthrough().optional().nullable()
});

export const FormSubmissionCreateDataModel = zod.object({
    data: zod.object({}).passthrough().optional().default({}),
    meta: zod
        .object({
            ip: zod.string().optional().default(""),
            submittedOn: zod.string().optional().default(new Date().toISOString()),
            url: zod
                .object({
                    location: zod.string().optional(),
                    query: zod.object({}).passthrough().optional()
                })
                .optional()
                .default({})
        })
        .optional()
        .default({
            ip: "",
            submittedOn: new Date().toISOString(),
            url: {}
        }),
    form: zod.object({
        id: zod.string(),
        parent: zod.string(),
        name: zod.string(),
        version: zod.number(),
        steps: zod.array(FormStepsModel).optional().default([]),
        fields: zod.array(FormFieldsModel).optional().default([])
    })
});

export const FormSubmissionUpdateDataModel = zod.object({
    id: zod.string(),
    logs: zod
        .array(
            zod.object({
                type: zod.enum(["error", "warning", "info", "success"]),
                message: zod.string(),
                data: zod.object({}).optional().default({}),
                createdOn: zod.string().optional().default(new Date().toISOString())
            })
        )
        .optional()
        .default([])
});
