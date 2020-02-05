import { flow } from "lodash";
import { validation } from "@webiny/validation";
import { withFields, string, withName, fields, object } from "@webiny/commodo";
import { i18nString } from "@webiny/api-i18n/fields";

export default ({ createBase, context }) => {
    return flow(
        withName("CmsContentModel"),
        withFields({
            title: string({ validation: validation.create("required") }),
            modelId: string({ validation: validation.create("required") }),
            description: string(),
            fields: fields({
                list: true,
                value: [],
                instanceOf: withFields({
                    _id: string({ validation: validation.create("required") }),
                    fieldId: string({ validation: validation.create("required") }),
                    label: i18nString({ context, validation: validation.create("required") }),
                    type: string({ validation: validation.create("required") }),
                    validation: fields({
                        list: true,
                        value: [],
                        instanceOf: withFields({
                            name: string({ validation: validation.create("required") }),
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
