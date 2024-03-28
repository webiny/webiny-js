import { validation } from "@webiny/validation";
/**
 * Package @commodo/fields does not have types.
 */
// @ts-expect-error
import { boolean, fields, string, withFields, number } from "@commodo/fields";
/**
 * Package commodo-fields-object does not have types.
 */
// @ts-expect-error
import { object } from "commodo-fields-object";

export const FormFieldsModel = withFields({
    _id: string({ validation: validation.create("required") }),
    type: string({ validation: validation.create("required") }),
    name: string({ validation: validation.create("required") }),
    fieldId: string({ validation: validation.create("required") }),
    /**
     * Note: We've replaced "i18nString()" with "string()"
     */
    label: string({ validation: validation.create("required") }),
    helpText: string({}),
    placeholderText: string({}),
    options: fields({
        list: true,
        value: [],
        instanceOf: withFields({
            label: string({}),
            value: string({ value: "" })
        })()
    }),
    validation: fields({
        list: true,
        value: [],
        instanceOf: withFields({
            name: string({ validation: validation.create("required") }),
            message: string({}),
            settings: object({ value: {} })
        })()
    }),
    settings: object({ value: {} })
})();

export const FormStepsModel = withFields({
    steps: fields({
        value: {},
        instanceOf: withFields({
            title: string(),
            layout: object({ value: [] }),
            rules: object({ value: [] })
        })()
    })
})();

export const FormSettingsModel = withFields({
    layout: fields({
        value: {},
        instanceOf: withFields({
            renderer: string({ value: "default" })
        })()
    }),
    /**
     * Note: We've replaced "i18nString()" with "string()"
     */
    submitButtonLabel: string({}),
    fullWidthSubmitButton: boolean(),
    /**
     * Note: We've replaced "i18nObject()" with "object()"
     */
    successMessage: object(),
    termsOfServiceMessage: fields({
        instanceOf: withFields({
            message: object(),
            errorMessage: string({}),
            enabled: boolean()
        })()
    }),
    reCaptcha: fields({
        value: {},
        instanceOf: withFields({
            enabled: boolean(),
            /**
             * Note: We've replaced "i18nString()" with "string()"
             */
            errorMessage: string({
                value: "Please verify that you are not a robot."
            })
        })()
    })
})();

export const FormCreateDataModel = withFields({
    name: string({ validation: validation.create("required") })
})();

export const FormUpdateDataModel = withFields({
    name: string({}),
    fields: fields({
        list: true,
        value: [],
        instanceOf: FormFieldsModel
    }),
    steps: object({ instanceOf: FormStepsModel, value: {} }),
    settings: fields({ instanceOf: FormSettingsModel, value: {} }),
    triggers: object()
})();

export const FormSubmissionCreateDataModel = withFields({
    data: object({ validation: validation.create("required") }),
    meta: fields({
        value: {},
        instanceOf: withFields({
            ip: string({}),
            submittedOn: string({
                value: new Date().toISOString()
            }),
            url: fields({
                value: {},
                instanceOf: withFields({
                    location: string(),
                    query: object()
                })()
            })
        })()
    }),
    form: fields({
        instanceOf: withFields({
            id: string({ validation: validation.create("required") }),
            parent: string({ validation: validation.create("required") }),
            name: string({ validation: validation.create("required") }),
            version: number({ validation: validation.create("required") }),
            steps: object({ instanceOf: FormStepsModel, value: {} }),
            fields: fields({
                list: true,
                value: [],
                instanceOf: FormFieldsModel
            })
        })()
    })
})();

export const FormSubmissionUpdateDataModel = withFields({
    id: string({ validation: validation.create("required") }),
    logs: fields({
        list: true,
        value: [],
        instanceOf: withFields({
            type: string({
                validation: validation.create("required,in:error:warning:info:success")
            }),
            message: string(),
            data: object(),
            createdOn: string({ value: new Date().toISOString() })
        })()
    })
})();
