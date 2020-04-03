import { validation } from "@webiny/validation";
import {
    pipe,
    withFields,
    string,
    withName,
    fields,
    object,
    boolean,
    ref,
    withHooks
} from "@webiny/commodo";
import { i18nString } from "@webiny/api-i18n/fields";

const required = validation.create("required");

export default ({ createBase, context }) =>
    pipe(
        withName(`CmsContentModel`),
        withFields({
            title: string({ validation: required }),
            modelId: string({ validation: required }),
            description: string({ validation: validation.create("maxLength:200") }),
            layout: object({ value: [] }),
            group: ref({ instanceOf: context.models.CmsContentModelGroup, validation: required }),
            fields: fields({
                list: true,
                value: [],
                instanceOf: withFields({
                    _id: string({ validation: required }),
                    fieldId: string({ validation: required }),
                    name: string({ validation: validation.create("required") }),
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
                    localization: boolean({ validation: required }),
                    unique: boolean({ validation: required }),
                    searchable: boolean({ validation: required }),
                    sortable: boolean({ validation: required }),
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
                })()
            })
        }),
        withHooks({
            async afterSave() {
                const environment = context.cms.getEvironment();
                environment.changedOn = new Date();
                await environment.save();
            }
        })
    )(createBase());
