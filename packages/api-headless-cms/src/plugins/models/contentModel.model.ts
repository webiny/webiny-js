import { flow } from "lodash";
import { validation } from "@webiny/validation";
import { withFields, string, withName, fields, object, boolean } from "@webiny/commodo";
import { i18nString } from "@webiny/api-i18n/fields";

const required = validation.create("required");

export default ({ createBase, context }) => {
    return flow(
        withName("CmsContentModel"),
        withFields({
            title: string({ validation: required }),
            modelId: string({ validation: required }),
            description: string(),
            fields: fields({
                list: true,
                value: [],
                instanceOf: withFields({
                    _id: string({ validation: required }),
                    fieldId: string({ validation: required }),
                    label: i18nString({ context, validation: required }),
                    type: string({ validation: required }),
                    localization: boolean({ validation: required }),
                    unique: boolean({ validation: required }),
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
        })
    )(createBase());
};
