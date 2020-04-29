import { i18nString } from "@webiny/api-i18n/fields";
import { validation } from "@webiny/validation";
import { withFields, string, fields, object, boolean } from "@webiny/commodo";

const required = validation.create("required");

export default context =>
    withFields({
        _id: string({ validation: required }),
        fieldId: string({ validation: required }),
        name: string({ validation: required }),
        label: i18nString({ context, validation: required }),
        helpText: i18nString({ context }),
        placeholderText: i18nString({ context }),
        options: fields({
            list: true,
            value: [],
            instanceOf: withFields({
                label: i18nString({ context }),
                value: string({ value: "" })
            })()
        }),
        type: string({ validation: required }),
        unique: boolean({ validation: required, value: false }),
        searchable: boolean({ validation: required, value: false }),
        sortable: boolean({ validation: required, value: false }),
        validation: fields({
            list: true,
            value: [],
            instanceOf: withFields({
                name: string({ validation: required }),
                message: i18nString({ context }),
                settings: object({ value: {} })
            })()
        }),
        settings: object({ value: {} })
    })();
