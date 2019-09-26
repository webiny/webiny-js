// @flow
import { flow } from "lodash";
import { validation } from "@webiny/validation";

import { withFields, string, withName } from "@webiny/commodo";

export default ({ createBase }) =>
    flow(
        withName("PbCategory"),
        withFields({
            name: string({ validation: validation.create("required") }),
            slug: string({ validation: validation.create("required") }),
            url: string({ validation: validation.create("required") }),
            layout: string()
        })
    )(createBase());
