// @flow
import { flow } from "lodash";
import { validation } from "@webiny/validation";

import { withFields, string, withName, fields, object } from "@webiny/commodo";

export default ({ createBase }) => {
    return flow(
        withName("CmsContent"),
        withFields({
            title: string({ validation: validation.create("required") }),
            modelId: string({ validation: validation.create("required") }),
            description: string(),
            fields: fields({
                list: true,
                value: [],
                instanceOf: withFields({
                    id: string(),
                    label: string(),
                    type: string(),
                    validation: object({ value: [] }),
                    settings: object({ value: {} })
                })
            })
        })
    )(createBase());
};
