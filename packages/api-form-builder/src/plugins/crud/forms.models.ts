import { validation } from "@webiny/validation";
/**
 * Package @commodo/fields does not have types.
 */
// @ts-ignore
import { boolean, fields, string, withFields, number } from "@commodo/fields";
/**
 * Package commodo-fields-object does not have types.
 */
// @ts-ignore
import { object } from "commodo-fields-object";

export const FormFieldsModel = withFields({
    _id: string({ validation: validation.create("required") }),
    type: string({ validation: validation.create("required") }),
    name: string({ validation: validation.create("required") }),
    fieldId: string({ validation: validation.create("required") }),
    /**
     * Note: We've replaced "i18nString()" with "string()"
     */
    label: string({ validation: validation.create("maxLength:100") }),
    helpText: string({ validation: validation.create("maxLength:255") }),
    placeholderText: string({ validation: validation.create("maxLength:100") }),
    options: fields({
        list: true,
        value: [],
        instanceOf: withFields({
            label: string({ validation: validation.create("maxLength:100") }),
            value: string({ value: "" })
        })()
    }),
    validation: fields({
        list: true,
        value: [],
        instanceOf: withFields({
            name: string({ validation: validation.create("required") }),
            message: string({ validation: validation.create("maxLength:100") }),
            settings: object({ value: {} })
        })()
    }),
    settings: object({ value: {} })
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
    submitButtonLabel: string({ validation: validation.create("maxLength:100") }),
    /**
     * Note: We've replaced "i18nObject()" with "object()"
     */
    successMessage: object(),
    termsOfServiceMessage: fields({
        instanceOf: withFields({
            message: object(),
            errorMessage: string({ validation: validation.create("maxLength:100") }),
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
                value: "Please verify that you are not a robot.",
                validation: validation.create("maxLength:100")
            })
        })()
    })
})();

export const FormCreateDataModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") })
})();

export const FormUpdateDataModel = withFields({
    name: string({ validation: validation.create("maxLength:100") }),
    fields: fields({
        list: true,
        value: [],
        instanceOf: FormFieldsModel
    }),
    layout: object({ value: [] }),
    settings: fields({ instanceOf: FormSettingsModel, value: {} }),
    triggers: object()
})();

export const FormSubmissionCreateDataModel = withFields({
    data: object({ validation: validation.create("required") }),
    meta: fields({
        value: {},
        instanceOf: withFields({
            ip: string({ validation: validation.create("required,maxLength:100") }),
            submittedOn: string({
                value: new Date().toISOString(),
                validation: validation.create("maxLength:100")
            })
        })()
    }),
    form: fields({
        instanceOf: withFields({
            id: string({ validation: validation.create("required") }),
            parent: string({ validation: validation.create("required") }),
            name: string({ validation: validation.create("required") }),
            version: number({ validation: validation.create("required") }),
            layout: object({ value: [] }),
            fields: fields({
                list: true,
                value: [],
                instanceOf: FormFieldsModel
            })
        })()
    })
})();

export const FormSubmissionUpdateDataModel = withFields({
    id: string({ validation: validation.create("required,maxLength:100") }),
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
