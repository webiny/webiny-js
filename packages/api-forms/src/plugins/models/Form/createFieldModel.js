import { i18nString } from "@webiny/api-i18n/fields";
import { validation } from "@webiny/validation";
import { withFields, string, fields, object } from "@webiny/commodo";

export default context =>
    withFields({
        _id: string({ validation: validation.create("required") }),
        type: string({ validation: validation.create("required") }),
        name: string({ validation: validation.create("required") }),
        fieldId: string({ validation: validation.create("required") }),
        label: i18nString({ context }),
        helpText: i18nString({ context }),
        placeholderText: i18nString({ context }),
        options: fields({
            list: true,
            instanceOf: withFields({
                label: i18nString({ context }),
                value: string({ value: "" })
            })()
        }),
        validation: fields({
            list: true,
            instanceOf: withFields({
                name: string({ validation: validation.create("required") }),
                message: i18nString({ context }),
                settings: object({ value: {} })
            })()
        }),
        settings: object({ value: {} })
    })();
